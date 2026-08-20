/**
 * Stage 1 — feasibility gate. Boolean only, no scoring.
 * A job is infeasible if ANY reason fires. This set is the denominator
 * for everything downstream, including jobs-unlocked. See CLAUDE.md §3.
 *
 * Do not blend these checks into the weighted score in scoring.ts.
 */

import type { Candidate, Job, FeasibilityResult, InfeasibilityReason } from "./types";
import { bestCommute } from "./commute";

/** Minimum fraction of the shift's duration that must fall inside the candidate's daily window. */
const MIN_SHIFT_TIME_COVERAGE = 0.75;
/** Minimum fraction of the shift's days that must be in the candidate's available days. */
const MIN_SHIFT_DAY_COVERAGE = 0.5;

/** Run the feasibility gate for one candidate against one job. */
export function checkFeasibility(candidate: Candidate, job: Job): FeasibilityResult {
  const { constraints } = candidate;
  const { availability } = constraints;
  const reasons: InfeasibilityReason[] = [];

  if (job.salaryMax < constraints.minMonthlySalary) {
    reasons.push("salary_below_floor");
  }

  const commute = bestCommute(candidate.location, job.location, constraints.availableModes);

  if (commute === null) {
    reasons.push("no_transport_route");
  } else if (commute.minutes > constraints.maxCommuteMinutes) {
    reasons.push("commute_too_long");
  }

  const coveredDayCount = job.shift.days.filter((day) => availability.availableDays.includes(day)).length;
  const dayCoverage = job.shift.days.length > 0 ? coveredDayCount / job.shift.days.length : 0;

  const shiftDurationMin = job.shift.endMin - job.shift.startMin;
  const overlapMin = Math.max(
    0,
    Math.min(job.shift.endMin, availability.latestEndMin) -
      Math.max(job.shift.startMin, availability.earliestStartMin)
  );
  const timeCoverage = shiftDurationMin > 0 ? overlapMin / shiftDurationMin : 0;

  if (dayCoverage < MIN_SHIFT_DAY_COVERAGE || timeCoverage < MIN_SHIFT_TIME_COVERAGE) {
    reasons.push("schedule_conflict");
  }

  if (job.hoursPerWeek < availability.minHoursPerWeek) {
    reasons.push("insufficient_hours");
  }

  const hasAllCredentials = job.hardEligibility.every((requirement) =>
    constraints.credentials.includes(requirement)
  );
  if (!hasAllCredentials) {
    reasons.push("missing_hard_eligibility");
  }

  return {
    jobId: job.id,
    feasible: reasons.length === 0,
    reasons,
    bestCommute: commute,
  };
}

/** Run the feasibility gate across a job pool. Returns one result per job. */
export function filterFeasibleJobs(candidate: Candidate, jobs: Job[]): FeasibilityResult[] {
  return jobs.map((job) => checkFeasibility(candidate, job));
}
