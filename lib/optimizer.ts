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

function jobSalaryMidpoint(job: Job): number {
  return (job.salaryMin + job.salaryMax) / 2;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** All non-empty subsets of `items`, size 1 up to `k`, in deterministic order. */
function subsetsUpToSize(items: string[], k: number): string[][] {
  const results: string[][] = [];

  function combinations(start: number, size: number, chosen: string[]): void {
    if (size === 0) {
      results.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - size; i++) {
      chosen.push(items[i]);
      combinations(i + 1, size - 1, chosen);
      chosen.pop();
    }
  }

  for (let size = 1; size <= k; size++) {
    combinations(0, size, []);
  }

  return results;
}

/** requiredSkills(j) \ heldSkillIds — skills the candidate still needs for job j. */
export function missingSkills(job: Job, heldSkillIds: Set<string>): string[] {
  return job.requiredSkills.filter((skillId) => !heldSkillIds.has(skillId));
}

/** Snapshot of qualified/feasible counts for a given held-skill set. */
export function computeOpportunitySnapshot(
  feasibleJobs: Job[],
  heldSkillIds: Set<string>
): OpportunitySnapshot {
  const qualifiedJobs = feasibleJobs.filter((job) => missingSkills(job, heldSkillIds).length === 0);

  return {
    feasibleCount: feasibleJobs.length,
    qualifiedCount: qualifiedJobs.length,
    qualifiedJobIds: qualifiedJobs.map((job) => job.id),
    medianSalary: median(qualifiedJobs.map(jobSalaryMidpoint)),
  };
}

/** Prune the skill universe to skills appearing in at least one missing(j). */
export function pruneSkillUniverse(feasibleJobs: Job[], heldSkillIds: Set<string>): string[] {
  const universe = new Set<string>();

  for (const job of feasibleJobs) {
    for (const skillId of missingSkills(job, heldSkillIds)) {
      universe.add(skillId);
    }
  }

  return [...universe].sort();
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
  const universe = pruneSkillUniverse(feasibleJobs, heldSkillIds);
  const baseline = computeOpportunitySnapshot(feasibleJobs, heldSkillIds);
  const baselineQualified = new Set(baseline.qualifiedJobIds);

  const scored = subsetsUpToSize(universe, k).map((skillIds) => {
    const candidateSkillIds = new Set([...heldSkillIds, ...skillIds]);
    const after = computeOpportunitySnapshot(feasibleJobs, candidateSkillIds);

    const newlyUnlockedJobIds = after.qualifiedJobIds.filter((id) => !baselineQualified.has(id));
    const newlyUnlockedJobs = feasibleJobs.filter((job) => newlyUnlockedJobIds.includes(job.id));
    const totalLearnHours = skillIds.reduce(
      (sum, skillId) => sum + (learnHoursBySkillId.get(skillId) ?? 0),
      0
    );
    const jobsUnlocked = newlyUnlockedJobIds.length;

    const bundle: SkillBundleRecommendation = {
      skillIds,
      jobsUnlocked,
      newlyUnlockedJobIds,
      totalLearnHours,
      jobsPer10Hours: totalLearnHours > 0 ? (jobsUnlocked / totalLearnHours) * 10 : 0,
      medianSalaryBefore: baseline.medianSalary,
      medianSalaryAfter: after.medianSalary,
    };

    const tieBreakMedian = median(newlyUnlockedJobs.map(jobSalaryMidpoint)) ?? -Infinity;

    return { bundle, tieBreakMedian };
  });

  scored.sort((a, b) => {
    if (b.bundle.jobsPer10Hours !== a.bundle.jobsPer10Hours) {
      return b.bundle.jobsPer10Hours - a.bundle.jobsPer10Hours;
    }
    return b.tieBreakMedian - a.tieBreakMedian;
  });

  return scored.map((s) => s.bundle);
}

/** Feasible jobs where exactly one required skill is missing. */
export function computeNearMissFrontier(
  feasibleJobs: Job[],
  heldSkillIds: Set<string>
): NearMissJob[] {
  const frontier: NearMissJob[] = [];

  for (const job of feasibleJobs) {
    const missing = missingSkills(job, heldSkillIds);
    if (missing.length === 1) {
      frontier.push({ jobId: job.id, missingSkillId: missing[0] });
    }
  }

  return frontier;
}

/**
 * UI-facing bucketing of feasible jobs by how many required skills are
 * missing: exactly 1, exactly 2, or 3+. Built directly on missingSkills() —
 * a strict generalization of computeNearMissFrontier's "exactly 1" frontier
 * into three display buckets for the near-miss chart. Does not replace or
 * alter computeNearMissFrontier, which remains the canonical single-skill
 * frontier used elsewhere.
 */
export type NearMissBucketSize = "1_skill" | "2_skills" | "3_plus_skills";

export interface NearMissBucket {
  bucket: NearMissBucketSize;
  jobIds: string[];
}

export function computeNearMissBuckets(
  feasibleJobs: Job[],
  heldSkillIds: Set<string>
): NearMissBucket[] {
  const buckets: Record<NearMissBucketSize, string[]> = {
    "1_skill": [],
    "2_skills": [],
    "3_plus_skills": [],
  };

  for (const job of feasibleJobs) {
    const missingCount = missingSkills(job, heldSkillIds).length;
    if (missingCount === 1) buckets["1_skill"].push(job.id);
    else if (missingCount === 2) buckets["2_skills"].push(job.id);
    else if (missingCount >= 3) buckets["3_plus_skills"].push(job.id);
  }

  return (["1_skill", "2_skills", "3_plus_skills"] as NearMissBucketSize[]).map((bucket) => ({
    bucket,
    jobIds: buckets[bucket],
  }));
}
