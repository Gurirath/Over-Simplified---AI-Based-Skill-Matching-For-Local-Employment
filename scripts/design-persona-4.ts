/**
 * Design/validation script for a candidate fourth persona (Devi R.) whose
 * implied claims are actually required by feasible jobs — proving the
 * micro-verification demo screen (CLAUDE.md §5) does something, unlike the
 * 3 existing personas where confirming implied claims changes nothing.
 *
 * Her rawStory describes ACTIVITIES, not skill names: a one-line role
 * summary ("I've worked in a godown for 4 years") that the model tags
 * `implied`, plus separately-described concrete actions (loading/unloading,
 * forklift, safety) that get `stated`/`demonstrated` and are already held
 * pre-verification. jobs.json has 6 warehouse/forklift listings that all
 * require SKILL_WAREHOUSE_OPS alongside skills she already holds — so
 * confirming the implied claim should flip several of them to qualified.
 *
 * Extraction is a REAL Gemini call (cached to disk on first run, same as
 * every other persona/eval story — CLAUDE.md §11).
 *
 * Run with: npx tsx scripts/design-persona-4.ts
 * Requires GEMINI_API_KEY on first run; cached thereafter.
 */

import {
  ExtractionError,
  applyVerificationAnswer,
  heldSkillIds,
  ingestCandidateExtraction,
  parseModelJson,
} from "../lib/extract";
import { cacheKey, readCachedResponse, writeCachedResponse } from "../lib/llmCache";
import { filterFeasibleJobs } from "../lib/feasibility";
import { computeOpportunitySnapshot } from "../lib/optimizer";
import { CANDIDATE_EXTRACTION_SYSTEM, candidateExtractionUser } from "../lib/prompts";
import type { Candidate, CandidateExtractionResponse, Job, SkillClaim } from "../lib/types";

import jobsData from "../data/jobs.json" with { type: "json" };

const jobs = jobsData as Job[];

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
}
interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
}

const PERSONA_ID = "PERSONA_DEVI";
const DISPLAY_NAME = "Devi R.";
const RAW_STORY =
  "Main last 4 saal se godown mein kaam karti hoon. Maal loading unloading khud karti hoon, " +
  "forklift bhi chalati hoon jab zarurat padti hai. Safety rules follow karti hoon, PPE pehnti hoon kaam ke time. " +
  "Hindi bolti hoon.";

const candidate: Candidate = {
  id: PERSONA_ID,
  displayName: DISPLAY_NAME,
  location: { lat: 12.92, lng: 79.13 },
  rawStory: RAW_STORY,
  skillClaims: [],
  constraints: {
    minMonthlySalary: 10000,
    maxCommuteMinutes: 45,
    availableModes: ["walk", "bus", "cycle"],
    availability: {
      earliestStartMin: 480,
      latestEndMin: 1110,
      minHoursPerWeek: 30,
      maxHoursPerWeek: 50,
      availableDays: [1, 2, 3, 4, 5, 6],
    },
    credentials: [],
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callModel(userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

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
      if (attempt >= MAX_429_RETRIES) throw new Error(`Gemini API rate limited after ${MAX_429_RETRIES} retries`);
      await sleep(Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS));
      continue;
    }
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errBody}`);
    }
    const data = (await response.json()) as GeminiGenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new ExtractionError("Model response contained no text content");
    return text;
  }
}

function confirmAllImplied(claims: SkillClaim[]): SkillClaim[] {
  let result = claims;
  for (const c of claims) {
    if (c.tier === "implied") result = applyVerificationAnswer(result, c.skillId, true);
  }
  return result;
}

async function main() {
  const userPrompt = candidateExtractionUser(RAW_STORY);
  const key = cacheKey(CACHE_KIND, CANDIDATE_EXTRACTION_SYSTEM, userPrompt);

  let raw = readCachedResponse(key);
  if (raw === null) {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const rawText = await callModel(userPrompt);
      try {
        parseModelJson<CandidateExtractionResponse>(rawText);
        writeCachedResponse(key, rawText, { model: GEMINI_MODEL, kind: CACHE_KIND, personaId: PERSONA_ID });
        raw = rawText;
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (raw === null) throw new ExtractionError(`Malformed output after ${MAX_ATTEMPTS} attempts: ${lastError}`);
  }

  const parsed = parseModelJson<CandidateExtractionResponse>(raw);
  const { claims } = ingestCandidateExtraction(parsed, RAW_STORY);
  const confirmedClaims = confirmAllImplied(claims);

  console.log(`\n${DISPLAY_NAME} — raw story: "${RAW_STORY}"\n`);
  console.log("Claims:");
  for (const c of claims) {
    console.log(`  [${c.tier.padEnd(12)}] ${c.skillId}  —  "${c.evidenceSpan}"`);
  }

  const preHeld = heldSkillIds(claims);
  const postHeld = heldSkillIds(confirmedClaims);
  const impliedIds = claims.filter((c) => c.tier === "implied").map((c) => c.skillId);
  console.log(`\nImplied claims (unconfirmed pre-verification): ${impliedIds.join(", ") || "(none)"}`);

  const feasibilityResults = filterFeasibleJobs(candidate, jobs);
  const feasibleJobIds = new Set(feasibilityResults.filter((r) => r.feasible).map((r) => r.jobId));
  const feasibleJobs = jobs.filter((job) => feasibleJobIds.has(job.id));

  const preSnapshot = computeOpportunitySnapshot(feasibleJobs, preHeld);
  const postSnapshot = computeOpportunitySnapshot(feasibleJobs, postHeld);

  const preQualifiedIds = new Set(
    feasibleJobs.filter((j) => j.requiredSkills.every((s) => preHeld.has(s))).map((j) => j.id)
  );
  const postQualifiedIds = new Set(
    feasibleJobs.filter((j) => j.requiredSkills.every((s) => postHeld.has(s))).map((j) => j.id)
  );
  const newlyQualified = [...postQualifiedIds].filter((id) => !preQualifiedIds.has(id));

  console.log(`\nFeasible jobs: ${feasibleJobs.length}`);
  console.log(`Pre-verification qualified:  ${preSnapshot.qualifiedCount}`);
  console.log(`Post-verification qualified: ${postSnapshot.qualifiedCount}`);
  console.log(`Newly qualified after confirming implied claims: ${newlyQualified.length}`);
  if (newlyQualified.length > 0) {
    console.log("  " + newlyQualified.map((id) => {
      const job = jobs.find((j) => j.id === id)!;
      return `${id} (${job.title}, requires: ${job.requiredSkills.join(", ")})`;
    }).join("\n  "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
