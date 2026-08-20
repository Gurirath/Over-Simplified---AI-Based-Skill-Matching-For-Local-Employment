/**
 * Eval harness for the candidate-story extraction pipeline. CLAUDE.md §12:
 * 12 hand-labelled candidate stories in mixed Hindi/Tamil-English, with
 * ground-truth skill IDs. Reports precision, recall and F1 as a table, plus
 * an ablation comparing full normalization (exact alias -> exact canonical
 * -> containment -> token overlap) against exact-alias-only matching, to
 * show the taxonomy/normalizer work was actually necessary.
 *
 * Cases: the 3 demo personas (data/personas.json) plus 9 hand-written
 * stories (data/eval-stories.json) spanning trades, care, logistics and
 * hospitality, so the eval isn't retail-heavy.
 *
 * Extraction responses are cache-first, using the exact same cache key
 * formula, system prompt and Gemini call as the live route, so this reuses
 * the committed persona cache with zero network calls and only hits the
 * API for the 9 new stories (once — the result is then cached to disk too).
 *
 * Run with: npx tsx scripts/eval.ts
 * Requires GEMINI_API_KEY for any case not already cached.
 */

import {
  ExtractionError,
  ingestCandidateExtraction,
  parseModelJson,
} from "../lib/extract";
import { cacheKey, readCachedResponse, writeCachedResponse } from "../lib/llmCache";
import { normalizeSkillMentionExactAliasOnly } from "../lib/normalize";
import { CANDIDATE_EXTRACTION_SYSTEM, candidateExtractionUser } from "../lib/prompts";
import type { CandidateExtractionResponse } from "../lib/types";

import personasData from "../data/personas.json" with { type: "json" };
import evalStoriesData from "../data/eval-stories.json" with { type: "json" };

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

interface EvalCase {
  id: string;
  displayName: string;
  sector: string;
  rawStory: string;
  expectedSkillIds: string[];
}

interface Persona {
  id: string;
  displayName: string;
  rawStory: string;
  expectedSkillIds: string[];
}

const PERSONA_SECTORS: Record<string, string> = {
  PERSONA_KAVITHA: "retail",
  PERSONA_RAMESH: "office_admin",
  PERSONA_PRIYA: "hospitality",
};

const personas = (personasData as Persona[]).map((p) => ({
  id: p.id,
  displayName: p.displayName,
  sector: PERSONA_SECTORS[p.id] ?? "unknown",
  rawStory: p.rawStory,
  expectedSkillIds: p.expectedSkillIds,
}));

const cases: EvalCase[] = [...personas, ...(evalStoriesData as EvalCase[])];

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

/** Cache-first fetch of the raw extraction JSON for one story. */
async function getRawExtraction(evalCase: EvalCase): Promise<string> {
  const userPrompt = candidateExtractionUser(evalCase.rawStory);
  const key = cacheKey(CACHE_KIND, CANDIDATE_EXTRACTION_SYSTEM, userPrompt);

  const cached = readCachedResponse(key);
  if (cached !== null) return cached;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const rawText = await callModel(userPrompt);
    try {
      // Validate it parses before trusting it enough to cache.
      parseModelJson<CandidateExtractionResponse>(rawText);
      writeCachedResponse(key, rawText, { model: GEMINI_MODEL, kind: CACHE_KIND, personaId: evalCase.id });
      return rawText;
    } catch (err) {
      lastError = err;
    }
  }
  throw new ExtractionError(
    `Model returned malformed output after ${MAX_ATTEMPTS} attempts for ${evalCase.id}: ${lastError}`
  );
}

interface Metrics {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

function metricsFor(predicted: Set<string>, expected: Set<string>): Metrics {
  let tp = 0;
  for (const s of predicted) if (expected.has(s)) tp++;
  const fp = predicted.size - tp;
  const fn = expected.size - tp;
  const precision = predicted.size === 0 ? 0 : tp / predicted.size;
  const recall = expected.size === 0 ? 0 : tp / expected.size;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { tp, fp, fn, precision, recall, f1 };
}

function microAverage(perCase: Metrics[]): Metrics {
  const tp = perCase.reduce((a, m) => a + m.tp, 0);
  const fp = perCase.reduce((a, m) => a + m.fp, 0);
  const fn = perCase.reduce((a, m) => a + m.fn, 0);
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { tp, fp, fn, precision, recall, f1 };
}

function pct(x: number): string {
  return (x * 100).toFixed(1) + "%";
}

function padRight(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

async function main() {
  const fullPerCase: Array<{ evalCase: EvalCase; metrics: Metrics }> = [];
  const ablationPerCase: Metrics[] = [];

  for (const evalCase of cases) {
    const raw = await getRawExtraction(evalCase);
    const parsed = parseModelJson<CandidateExtractionResponse>(raw);
    const expected = new Set(evalCase.expectedSkillIds);

    const full = ingestCandidateExtraction(parsed, evalCase.rawStory);
    const fullPredicted = new Set(full.claims.map((c) => c.skillId));
    fullPerCase.push({ evalCase, metrics: metricsFor(fullPredicted, expected) });

    const ablation = ingestCandidateExtraction(parsed, evalCase.rawStory, normalizeSkillMentionExactAliasOnly);
    const ablationPredicted = new Set(ablation.claims.map((c) => c.skillId));
    ablationPerCase.push(metricsFor(ablationPredicted, expected));
  }

  console.log("\n=== Per-story precision / recall / F1 (full normalization) ===\n");
  const idCol = Math.max(...fullPerCase.map((r) => r.evalCase.displayName.length), "Story".length) + 2;
  const sectorCol = Math.max(...fullPerCase.map((r) => r.evalCase.sector.length), "Sector".length) + 2;
  console.log(
    padRight("Story", idCol) + padRight("Sector", sectorCol) +
    padRight("P", 8) + padRight("R", 8) + padRight("F1", 8) + "TP/FP/FN"
  );
  for (const { evalCase, metrics: m } of fullPerCase) {
    console.log(
      padRight(evalCase.displayName, idCol) + padRight(evalCase.sector, sectorCol) +
      padRight(pct(m.precision), 8) + padRight(pct(m.recall), 8) + padRight(pct(m.f1), 8) +
      `${m.tp}/${m.fp}/${m.fn}`
    );
  }
  const fullTotal = microAverage(fullPerCase.map((r) => r.metrics));
  console.log(
    padRight("TOTAL (micro-avg)", idCol) + padRight("", sectorCol) +
    padRight(pct(fullTotal.precision), 8) + padRight(pct(fullTotal.recall), 8) + padRight(pct(fullTotal.f1), 8) +
    `${fullTotal.tp}/${fullTotal.fp}/${fullTotal.fn}`
  );

  console.log("\n=== Ablation: full normalization vs exact-alias-only (micro-avg across all 12 stories) ===\n");
  const ablationTotal = microAverage(ablationPerCase);
  console.log(padRight("Variant", 22) + padRight("P", 8) + padRight("R", 8) + padRight("F1", 8) + "TP/FP/FN");
  console.log(
    padRight("Full normalization", 22) +
    padRight(pct(fullTotal.precision), 8) + padRight(pct(fullTotal.recall), 8) + padRight(pct(fullTotal.f1), 8) +
    `${fullTotal.tp}/${fullTotal.fp}/${fullTotal.fn}`
  );
  console.log(
    padRight("Exact-alias-only", 22) +
    padRight(pct(ablationTotal.precision), 8) + padRight(pct(ablationTotal.recall), 8) + padRight(pct(ablationTotal.f1), 8) +
    `${ablationTotal.tp}/${ablationTotal.fp}/${ablationTotal.fn}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
