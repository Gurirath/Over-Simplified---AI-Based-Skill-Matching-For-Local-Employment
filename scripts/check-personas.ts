/**
 * Diagnostic script — loads the demo personas and job corpus, runs the
 * feasibility gate + opportunity engine for each persona, and prints a
 * summary. Not a test; a manual sanity check against CLAUDE.md's numbers
 * (e.g. "Kavitha: 250 corpus -> 58 feasible -> 3 qualified").
 *
 * Run with: npx tsx scripts/check-personas.ts
 */

import { filterFeasibleJobs } from "../lib/feasibility";
import {
  computeOpportunitySnapshot,
  computeNearMissFrontier,
  recommendSkillBundles,
} from "../lib/optimizer";
import type { Candidate, CandidateConstraints, GeoPoint, Job, Skill } from "../lib/types";

import jobsData from "../data/jobs.json" with { type: "json" };
import personasData from "../data/personas.json" with { type: "json" };
import skillsData from "../data/skills.json" with { type: "json" };

interface Persona {
  id: string;
  displayName: string;
  location: GeoPoint;
  rawStory: string;
  expectedSkillIds: string[];
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

for (const persona of personas) {
  const candidate = personaToCandidate(persona);
  const heldSkillIds = new Set(persona.expectedSkillIds);

  const feasibilityResults = filterFeasibleJobs(candidate, jobs);
  const feasibleJobIds = new Set(
    feasibilityResults.filter((r) => r.feasible).map((r) => r.jobId)
  );
  const feasibleJobs = jobs.filter((job) => feasibleJobIds.has(job.id));

  const snapshot = computeOpportunitySnapshot(feasibleJobs, heldSkillIds);
  const nearMiss = computeNearMissFrontier(feasibleJobs, heldSkillIds);
  const bundles = recommendSkillBundles(feasibleJobs, heldSkillIds, learnHoursBySkillId, 3);
  const topBundles = bundles.slice(0, 3);

  console.log(`\n${persona.displayName} (${persona.id})`);
  console.log(`  feasible:  ${snapshot.feasibleCount}`);
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
        `${bundle.jobsPer10Hours.toFixed(2)} jobs/10h, median salary after: ${
          bundle.medianSalaryAfter ?? "n/a"
        }`
    );
  });
}
