/**
 * Diagnostic script — loads each demo persona's CACHED extraction (not
 * expectedSkillIds, which is eval ground truth, not what the app computes),
 * runs it through the real ingestion pipeline (ingestCandidateExtraction ->
 * heldSkillIds), then the feasibility gate + opportunity engine. Not a test;
 * a manual sanity check against CLAUDE.md's numbers (e.g. "Kavitha: 250
 * corpus -> 58 feasible -> N qualified").
 *
 * Reports two states, since heldSkillIds() treats `implied` claims as held
 * only once userConfirmed (CLAUDE.md §5) and the demo flow includes
 * micro-verification before a candidate sees their match results:
 *   - pre-verification:  implied claims NOT counted (fresh extraction)
 *   - post-verification: every implied claim confirmed "yes" (what the UI
 *                         shows after the candidate clears the verification
 *                         questions)
 *
 * Run with: npx tsx scripts/check-personas.ts
 */

import {
  applyVerificationAnswer,
  heldSkillIds,
  ingestCandidateExtraction,
  parseModelJson,
} from "../lib/extract";
import { cacheKey, readCachedResponse } from "../lib/llmCache";
import {
  computeOpportunitySnapshot,
  computeNearMissFrontier,
  recommendSkillBundles,
} from "../lib/optimizer";
import { filterFeasibleJobs } from "../lib/feasibility";
import { CANDIDATE_EXTRACTION_SYSTEM, candidateExtractionUser } from "../lib/prompts";
import type {
  Candidate,
  CandidateConstraints,
  CandidateExtractionResponse,
  GeoPoint,
  Job,
  Skill,
  SkillClaim,
} from "../lib/types";

import jobsData from "../data/jobs.json" with { type: "json" };
import personasData from "../data/personas.json" with { type: "json" };
import skillsData from "../data/skills.json" with { type: "json" };

const CACHE_KIND = "candidate-extraction";

interface Persona {
  id: string;
  displayName: string;
  location: GeoPoint;
  rawStory: string;
  constraints: CandidateConstraints;
}

const jobs = jobsData as Job[];
const personas = personasData as Persona[];
const skills = skillsData as Skill[];

const learnHoursBySkillId = new Map(skills.map((skill) => [skill.id, skill.learnHours]));
const skillNameById = new Map(skills.map((skill) => [skill.id, skill.canonicalName]));

function skillLabel(skillId: string): string {
  return skillNameById.get(skillId) ?? skillId;
}

function personaToCandidate(persona: Persona): Candidate {
  return {
    id: persona.id,
    displayName: persona.displayName,
    location: persona.location,
    rawStory: persona.rawStory,
    skillClaims: [],
    constraints: persona.constraints,
  };
}

/** Same yes-to-everything simulation the verification UI would produce. */
function confirmAllImplied(claims: SkillClaim[]): SkillClaim[] {
  let result = claims;
  for (const c of claims) {
    if (c.tier === "implied") {
      result = applyVerificationAnswer(result, c.skillId, true);
    }
  }
  return result;
}

function runFor(persona: Persona, heldSkills: Set<string>, feasibleJobs: Job[]) {
  const snapshot = computeOpportunitySnapshot(feasibleJobs, heldSkills);
  const nearMiss = computeNearMissFrontier(feasibleJobs, heldSkills);
  const bundles = recommendSkillBundles(feasibleJobs, heldSkills, learnHoursBySkillId, 3);
  const topBundles = bundles.slice(0, 3);

  console.log(`  qualified: ${snapshot.qualifiedCount}`);
  console.log(`  near-miss: ${nearMiss.length}`);
  console.log(`  top ${topBundles.length} skill bundles by jobs/10h:`);
  if (topBundles.length === 0) {
    console.log("    (none — no missing skills across the feasible set)");
  }
  topBundles.forEach((bundle, i) => {
    const skillLabels = bundle.skillIds.map(skillLabel).join(" + ");
    console.log(
      `    ${i + 1}. ${skillLabels}  ->  +${bundle.jobsUnlocked} jobs, ${bundle.totalLearnHours}h, ` +
        `${bundle.jobsPer10Hours.toFixed(2)} jobs/10h, median salary: ${
          bundle.medianSalaryBefore ?? "n/a"
        } -> ${bundle.medianSalaryAfter ?? "n/a"}`
    );
  });
}

for (const persona of personas) {
  const candidate = personaToCandidate(persona);

  const userPrompt = candidateExtractionUser(persona.rawStory);
  const key = cacheKey(CACHE_KIND, CANDIDATE_EXTRACTION_SYSTEM, userPrompt);
  const cachedRaw = readCachedResponse(key);
  if (cachedRaw === null) {
    console.log(`\n${persona.displayName} (${persona.id}) — NO CACHED EXTRACTION, skipping`);
    continue;
  }

  const parsed = parseModelJson<CandidateExtractionResponse>(cachedRaw);
  const { claims } = ingestCandidateExtraction(parsed, persona.rawStory);
  const confirmedClaims = confirmAllImplied(claims);

  const preHeld = heldSkillIds(claims);
  const postHeld = heldSkillIds(confirmedClaims);
  const impliedCount = claims.filter((c) => c.tier === "implied").length;

  const feasibilityResults = filterFeasibleJobs(candidate, jobs);
  const feasibleJobIds = new Set(feasibilityResults.filter((r) => r.feasible).map((r) => r.jobId));
  const feasibleJobs = jobs.filter((job) => feasibleJobIds.has(job.id));

  console.log(`\n${persona.displayName} (${persona.id})`);
  console.log(`  claims: ${claims.length} (${impliedCount} implied)`);
  console.log(`  feasible: ${feasibleJobs.length}`);

  console.log(`\n  -- pre-verification (implied claims not yet confirmed) --`);
  runFor(persona, preHeld, feasibleJobs);

  console.log(`\n  -- post-verification (all implied claims confirmed "yes") --`);
  runFor(persona, postHeld, feasibleJobs);
}
