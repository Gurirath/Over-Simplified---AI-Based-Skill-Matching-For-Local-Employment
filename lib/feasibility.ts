/**
 * Stage 1 — feasibility gate. Boolean only, no scoring.
 * A job is infeasible if ANY reason fires. This set is the denominator
 * for everything downstream, including jobs-unlocked. See CLAUDE.md §3.
 *
 * Do not blend these checks into the weighted score in scoring.ts.
 */

import type { Candidate, Job, FeasibilityResult } from "./types";

/** Run the feasibility gate for one candidate against one job. */
export function checkFeasibility(candidate: Candidate, job: Job): FeasibilityResult {
  throw new Error("Not implemented");
}

/** Run the feasibility gate across a job pool. Returns one result per job. */
export function filterFeasibleJobs(candidate: Candidate, jobs: Job[]): FeasibilityResult[] {
  throw new Error("Not implemented");
}
