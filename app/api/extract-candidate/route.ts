/**
 * POST /api/extract-candidate
 *
 * The candidate side of the system's ONE-of-two LLM calls (CLAUDE.md §2).
 * Cache-first: if this exact (prompt, story) pair was already extracted, no
 * network call is made at all — required for the no-network demo (§11).
 * On a cache miss, calls the model, validates the JSON shape via
 * ingestCandidateExtraction, retries once on malformed output, and — if the
 * retry also fails — falls back to whatever is cached (possibly nothing).
 *
 * Model: Gemini (gemini-3.5-flash) via raw REST, JSON response mode, with
 * exponential backoff on 429. Everything else — prompts, validation, the
 * retry-once-on-malformed-JSON loop, and the disk cache — is unchanged from
 * the Anthropic version.
 *
 * Request body:  { "story": string }
 * Response body: CandidateIngestResult & { fromCache: boolean }
 */

import { NextRequest, NextResponse } from "next/server";

import { ExtractionError, ingestCandidateExtraction, parseModelJson } from "@/lib/extract";
import { cacheKey, readCachedResponse, writeCachedResponse } from "@/lib/llmCache";
import { CANDIDATE_EXTRACTION_SYSTEM, candidateExtractionUser } from "@/lib/prompts";
import type { CandidateExtractionResponse } from "@/lib/types";
import type { CandidateIngestResult } from "@/lib/extract";

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CACHE_KIND = "candidate-extraction";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses and validates one candidate response against lib/extract.ts.
 * Throws ExtractionError if the top-level shape is wrong — the signal this
 * route treats as "malformed JSON" and retries on.
 */
function validateAndIngest(rawText: string, story: string): CandidateIngestResult {
  const parsed = parseModelJson<CandidateExtractionResponse>(rawText);
  return ingestCandidateExtraction(parsed, story);
}

/** Raw REST call to Gemini, JSON response mode, with exponential backoff on 429. */
async function callModel(userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const requestBody = {
    system_instruction: { parts: [{ text: CANDIDATE_EXTRACTION_SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: "minimal" },
    },
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

  const story = (body as { story?: unknown } | null)?.story;
  if (typeof story !== "string" || story.trim().length === 0) {
    return NextResponse.json({ error: "`story` must be a non-empty string" }, { status: 400 });
  }

  const userPrompt = candidateExtractionUser(story);
  const key = cacheKey(CACHE_KIND, CANDIDATE_EXTRACTION_SYSTEM, userPrompt);

  // Cache-first — the whole point is that the demo runs with no network.
  const cachedRaw = readCachedResponse(key);
  if (cachedRaw !== null) {
    try {
      const result = validateAndIngest(cachedRaw, story);
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
      const result = validateAndIngest(rawText, story);
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
      const result = validateAndIngest(fallbackRaw, story);
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
