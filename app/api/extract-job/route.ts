/**
 * POST /api/extract-job
 *
 * The employer side of the system's ONE-of-two LLM calls (CLAUDE.md §2).
 * Same cache-first / retry-once / fall-back-to-cache shape as
 * /api/extract-candidate — see that file's header comment for the full
 * rationale (CLAUDE.md §11: the demo must run with no network).
 *
 * Model: Gemini (gemini-3.5-flash) via raw REST, JSON response mode, with
 * exponential backoff on 429. Everything else — prompts, validation, the
 * retry-once-on-malformed-JSON loop, and the disk cache — is unchanged from
 * the Anthropic version.
 *
 * Request body:
 *   {
 *     "description": string,
 *     "id": string,
 *     "employerName": string,
 *     "location": { "lat": number, "lng": number },
 *     "areaName": string
 *   }
 * Response body: JobIngestResult & { fromCache: boolean }
 */

import { NextRequest, NextResponse } from "next/server";

import { ExtractionError, ingestJobExtraction, parseModelJson } from "@/lib/extract";
import { cacheKey, readCachedResponse, writeCachedResponse } from "@/lib/llmCache";
import { JOB_EXTRACTION_SYSTEM, jobExtractionUser } from "@/lib/prompts";
import type { JobExtractionResponse } from "@/lib/types";
import type { JobIngestResult } from "@/lib/extract";

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CACHE_KIND = "job-extraction";
const MAX_ATTEMPTS = 2; // one call + one retry on malformed JSON

const MAX_429_RETRIES = 5;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 16000;

interface GeminiPart {
  text?: string;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}
interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
}

interface JobIngestOpts {
  id: string;
  employerName: string;
  location: { lat: number; lng: number };
  areaName: string;
  rawDescription: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isJobIngestOpts(body: unknown): body is JobIngestOpts & { description: string } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.description !== "string" || b.description.trim().length === 0) return false;
  if (typeof b.id !== "string" || b.id.trim().length === 0) return false;
  if (typeof b.employerName !== "string" || b.employerName.trim().length === 0) return false;
  if (typeof b.areaName !== "string" || b.areaName.trim().length === 0) return false;
  const loc = b.location as { lat?: unknown; lng?: unknown } | undefined;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return false;
  return true;
}

/**
 * Parses and validates one job response against lib/extract.ts.
 * Throws ExtractionError if the top-level shape is wrong — the signal this
 * route treats as "malformed JSON" and retries on.
 */
function validateAndIngest(rawText: string, opts: JobIngestOpts): JobIngestResult {
  const parsed = parseModelJson<JobExtractionResponse>(rawText);
  return ingestJobExtraction(parsed, opts);
}

/** Raw REST call to Gemini, JSON response mode, with exponential backoff on 429. */
async function callModel(userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const requestBody = {
    system_instruction: { parts: [{ text: JOB_EXTRACTION_SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };

  for (let attempt = 0; ; attempt++) {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 429) {
      if (attempt >= MAX_429_RETRIES) {
        throw new Error(`Gemini API rate limited after ${MAX_429_RETRIES} retries`);
      }
      await sleep(Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS));
      continue;
    }

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errBody}`);
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) {
      throw new ExtractionError("Model response contained no text content");
    }
    return text;
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (!isJobIngestOpts(body)) {
    return NextResponse.json(
      {
        error:
          "Body must include non-empty `description`, `id`, `employerName`, `areaName`, and `location: { lat, lng }`",
      },
      { status: 400 }
    );
  }

  const { description, ...opts } = body;
  const ingestOpts: JobIngestOpts = { ...opts, rawDescription: description };

  const userPrompt = jobExtractionUser(description);
  const key = cacheKey(CACHE_KIND, JOB_EXTRACTION_SYSTEM, userPrompt);

  // Cache-first — the whole point is that the demo runs with no network.
  const cachedRaw = readCachedResponse(key);
  if (cachedRaw !== null) {
    try {
      const result = validateAndIngest(cachedRaw, ingestOpts);
      return NextResponse.json({ ...result, fromCache: true });
    } catch {
      // Fall through and re-extract — a corrupted cache entry should not
      // permanently break this input.
    }
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let rawText: string;
    try {
      rawText = await callModel(userPrompt);
    } catch (err) {
      // Network/auth errors, or 429 that outlasted the backoff budget, are
      // not "malformed JSON" — surface this now rather than retrying.
      return NextResponse.json(
        { error: "Gemini API call failed", detail: err instanceof Error ? err.message : String(err) },
        { status: 502 }
      );
    }

    try {
      const result = validateAndIngest(rawText, ingestOpts);
      writeCachedResponse(key, rawText, { model: GEMINI_MODEL, kind: CACHE_KIND });
      return NextResponse.json({ ...result, fromCache: false });
    } catch (err) {
      lastError = err;
    }
  }

  // Both attempts produced malformed JSON — last resort, fall back to
  // whatever is cached (CLAUDE.md §11). For a brand-new input there is
  // usually nothing to fall back to, which is a genuine failure.
  const fallbackRaw = readCachedResponse(key);
  if (fallbackRaw !== null) {
    try {
      const result = validateAndIngest(fallbackRaw, ingestOpts);
      return NextResponse.json({ ...result, fromCache: true });
    } catch {
      // fall through to the error response below
    }
  }

  return NextResponse.json(
    {
      error: `Model returned malformed output after ${MAX_ATTEMPTS} attempts and no cached fallback exists`,
      detail: lastError instanceof Error ? lastError.message : String(lastError),
    },
    { status: 502 }
  );
}
