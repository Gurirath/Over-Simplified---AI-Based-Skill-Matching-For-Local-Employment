/**
 * Opportunity engine — exact enumeration, NOT greedy. See CLAUDE.md §4.
 *
 * f(T) = |{ j in feasible jobs : missing(j) subset of T }| is monotone but
 * NOT submodular: jobs can require skill combinations (e.g. Tally + GST),
 * so two individually-zero-gain skills can jointly unlock a job. Greedy
 * hill-climbing would miss that. The pruned skill universe is small
 * (~25-45 skills) and k <= 3, so brute-force subset enumeration is exact
 * and still fast (C(40,3) ~= 9,880 subsets). Do not replace with greedy,
 * a heuristic, or an LLM call.
 */

import type {
  Job,
  OpportunitySnapshot,
  SkillBundleRecommendation,
  NearMissJob,
} from "./types";

/** requiredSkills(j) \ heldSkillIds — skills the candidate still needs for job j. */
export function missingSkills(job: Job, heldSkillIds: Set<string>): string[] {
  throw new Error("Not implemented");
}

/** Snapshot of qualified/feasible counts for a given held-skill set. */
export function computeOpportunitySnapshot(
  feasibleJobs: Job[],
  heldSkillIds: Set<string>
): OpportunitySnapshot {
  throw new Error("Not implemented");
}

/** Prune the skill universe to skills appearing in at least one missing(j). */
export function pruneSkillUniverse(feasibleJobs: Job[], heldSkillIds: Set<string>): string[] {
  throw new Error("Not implemented");
}

/**
 * Exact enumeration of skill bundles up to size k. Ranked by
 * jobsUnlocked / totalLearnHours, tie-broken on median salary of the
 * newly unlocked set.
 */
export function recommendSkillBundles(
  feasibleJobs: Job[],
  heldSkillIds: Set<string>,
  learnHoursBySkillId: Map<string, number>,
  k: number
): SkillBundleRecommendation[] {
  throw new Error("Not implemented");
}

/** Feasible jobs where exactly one required skill is missing. */
export function computeNearMissFrontier(
  feasibleJobs: Job[],
  heldSkillIds: Set<string>
): NearMissJob[] {
  throw new Error("Not implemented");
}
