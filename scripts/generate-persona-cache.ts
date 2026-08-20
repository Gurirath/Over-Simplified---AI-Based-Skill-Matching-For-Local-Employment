/**
 * Generates and commits the candidate-extraction cache entries for the 3
 * demo personas in data/personas.json, so /api/extract-candidate can serve
 * them from disk with zero network calls (CLAUDE.md §11).
 *
 * Uses the exact same cache key formula, system prompt, Gemini call (model
 * ID and x-goog-api-key header auth), and validation path (lib/extract.ts)
 * as the live route, so a cache entry written here is a guaranteed hit for
 * that persona's rawStory.
 *
 * Run with: npx tsx scripts/generate-persona-cache.ts
 * Requires GEMINI_API_KEY to be set.
 */

import { ExtractionError, ingestCandidateExtraction, parseModelJson } from "../lib/extract";
import { cacheKey, readCachedResponse, writeCachedResponse } from "../lib/llmCache";
import { CANDIDATE_EXTRACTION_SYSTEM, candidateExtractionUser } from "../lib/prompts";
import type { CandidateExtractionResponse } from "../lib/types";

import personasData from "../data/personas.json" with { type: "json" };

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CACHE_KIND = "candidate-extraction";
const MAX_ATTEMPTS = 2;

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

interface Persona {
  id: string;
  displayName: string;
  rawStory: string;
}

const personas = personasData as Persona[];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function main() {
  for (const persona of personas) {
    const userPrompt = candidateExtractionUser(persona.rawStory);
    const key = cacheKey(CACHE_KIND, CANDIDATE_EXTRACTION_SYSTEM, userPrompt);

    if (readCachedResponse(key) !== null) {
      console.log(`[skip] ${persona.displayName} (${persona.id}) — already cached`);
      continue;
    }

    let lastError: unknown = null;
    let ok = false;

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const rawText = await callModel(userPrompt);
        try {
          const parsed = parseModelJson<CandidateExtractionResponse>(rawText);
          const result = ingestCandidateExtraction(parsed, persona.rawStory);
          writeCachedResponse(key, rawText, { model: GEMINI_MODEL, kind: CACHE_KIND, personaId: persona.id });
          console.log(
            `[ok]   ${persona.displayName} (${persona.id}) — ${result.claims.length} claims, ` +
              `${result.unmatchedMentions.length} unmatched, ${result.droppedForBadSpan.length} dropped for bad span`
          );
          ok = true;
          break;
        } catch (err) {
          lastError = err;
          console.log(`[retry] ${persona.displayName} (${persona.id}) — attempt ${attempt} malformed: ${err}`);
        }
      }
    } catch (err) {
      // A network/auth/rate-limit failure from callModel is not "malformed
      // JSON" — same distinction the live route makes. Fail this persona
      // immediately rather than burning retries on it.
      lastError = err;
    }

    if (!ok) {
      console.error(`[FAIL] ${persona.displayName} (${persona.id}) — ${lastError}`);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
