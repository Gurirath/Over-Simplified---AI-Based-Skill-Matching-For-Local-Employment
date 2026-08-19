/**
 * Stage 2 — scoring. Runs only on jobs that already passed the
 * feasibility gate in feasibility.ts. See CLAUDE.md §3.
 *
 * Weighted sum of: skill coverage, experience relevance, commute margin,
 * salary headroom, schedule comfort. Weights are user-adjustable via
 * ScoreWeights, never hardcoded here.
 */

import type {
  Candidate,
  Job,
  ScoreWeights,
  MatchResult,
  CommuteEstimate,
} from "./types";

/** Score a single feasible job for a candidate. Caller must pre-filter with feasibility.ts. */
export function scoreJob(
  candidate: Candidate,
  job: Job,
  commute: CommuteEstimate,
  weights: ScoreWeights
): MatchResult {
  throw new Error("Not implemented");
}

/** Score every job in a feasible set, sorted by score descending. */
export function rankFeasibleJobs(
  candidate: Candidate,
  jobs: Job[],
  commutes: Map<string, CommuteEstimate>,
  weights: ScoreWeights
): MatchResult[] {
  throw new Error("Not implemented");
}
