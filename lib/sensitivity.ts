/**
 * Sensitivity analysis for the Opportunity Simulator UI.
 *
 * Pure functions layered ON TOP of lib/feasibility.ts — never modifies it.
 * Each step clones the candidate with exactly one constraint relaxed by a
 * fixed step, re-runs filterFeasibleJobs, and reports the delta. This is
 * why relaxing "salary floor" means LOWERING minMonthlySalary (a lower
 * floor is easier to clear), while relaxing "max commute" means RAISING
 * maxCommuteMinutes.
 */

import type { Candidate, CandidateConstraints, Job, TransportMode } from "./types";
import { filterFeasibleJobs } from "./feasibility";

export interface SensitivityStep {
  constraintName: string;
  originalValue: string;
  relaxedValue: string;
  additionalJobs: number;
  newFeasibleCount: number;
}

const COMMUTE_STEP_MIN = 15;
const START_STEP_MIN = 30;
const END_STEP_MIN = 60;
const SALARY_STEP = 1000;

const ALL_TRANSPORT_MODES: TransportMode[] = ["walk", "cycle", "bus", "two_wheeler"];

function countFeasible(candidate: Candidate, jobs: Job[]): number {
  return filterFeasibleJobs(candidate, jobs).filter((r) => r.feasible).length;
}

function withConstraints(candidate: Candidate, constraints: CandidateConstraints): Candidate {
  return { ...candidate, constraints };
}

function formatMinutesOfDay(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * One relaxation step per constraint dimension: max commute, earliest start,
 * latest end, transport modes, and salary floor. Each is evaluated
 * independently against the same baseline (not cumulatively).
 */
export function getConstraintSensitivitySteps(
  candidate: Candidate,
  allJobs: Job[]
): SensitivityStep[] {
  const baseCount = countFeasible(candidate, allJobs);
  const { constraints } = candidate;
  const steps: SensitivityStep[] = [];

  // 1. Max commute minutes, relaxed upward.
  const relaxedCommute = constraints.maxCommuteMinutes + COMMUTE_STEP_MIN;
  const commuteCount = countFeasible(
    withConstraints(candidate, { ...constraints, maxCommuteMinutes: relaxedCommute }),
    allJobs
  );
  steps.push({
    constraintName: "Maximum commute",
    originalValue: `${constraints.maxCommuteMinutes} min`,
    relaxedValue: `${relaxedCommute} min (+${COMMUTE_STEP_MIN} min)`,
    additionalJobs: Math.max(0, commuteCount - baseCount),
    newFeasibleCount: commuteCount,
  });

  // 2. Earliest start, relaxed earlier.
  const relaxedStart = Math.max(0, constraints.availability.earliestStartMin - START_STEP_MIN);
  const startCount = countFeasible(
    withConstraints(candidate, {
      ...constraints,
      availability: { ...constraints.availability, earliestStartMin: relaxedStart },
    }),
    allJobs
  );
  steps.push({
    constraintName: "Earliest start time",
    originalValue: formatMinutesOfDay(constraints.availability.earliestStartMin),
    relaxedValue: `${formatMinutesOfDay(relaxedStart)} (${START_STEP_MIN}m earlier)`,
    additionalJobs: Math.max(0, startCount - baseCount),
    newFeasibleCount: startCount,
  });

  // 3. Latest end, relaxed later.
  const relaxedEnd = Math.min(1440, constraints.availability.latestEndMin + END_STEP_MIN);
  const endCount = countFeasible(
    withConstraints(candidate, {
      ...constraints,
      availability: { ...constraints.availability, latestEndMin: relaxedEnd },
    }),
    allJobs
  );
  steps.push({
    constraintName: "Latest end time",
    originalValue: formatMinutesOfDay(constraints.availability.latestEndMin),
    relaxedValue: `${formatMinutesOfDay(relaxedEnd)} (${END_STEP_MIN}m later)`,
    additionalJobs: Math.max(0, endCount - baseCount),
    newFeasibleCount: endCount,
  });

  // 4. Add one missing transport mode, if any remain.
  const missingModes = ALL_TRANSPORT_MODES.filter((m) => !constraints.availableModes.includes(m));
  if (missingModes.length > 0) {
    const addedMode = missingModes[0];
    const modeCount = countFeasible(
      withConstraints(candidate, {
        ...constraints,
        availableModes: [...constraints.availableModes, addedMode],
      }),
      allJobs
    );
    steps.push({
      constraintName: "Transport modes",
      originalValue: constraints.availableModes.join(", "),
      relaxedValue: `Add ${addedMode}`,
      additionalJobs: Math.max(0, modeCount - baseCount),
      newFeasibleCount: modeCount,
    });
  }

  // 5. Salary floor, relaxed downward (a lower floor is easier to clear).
  const relaxedSalary = Math.max(0, constraints.minMonthlySalary - SALARY_STEP);
  const salaryCount = countFeasible(
    withConstraints(candidate, { ...constraints, minMonthlySalary: relaxedSalary }),
    allJobs
  );
  steps.push({
    constraintName: "Minimum salary",
    originalValue: `Rs${constraints.minMonthlySalary.toLocaleString("en-IN")}`,
    relaxedValue: `Rs${relaxedSalary.toLocaleString("en-IN")} (-Rs${SALARY_STEP.toLocaleString("en-IN")})`,
    additionalJobs: Math.max(0, salaryCount - baseCount),
    newFeasibleCount: salaryCount,
  });

  return steps;
}

/** Live delta for a fully custom simulated constraint set vs. the candidate's baseline. */
export function simulateCustomConstraints(
  candidate: Candidate,
  allJobs: Job[],
  simulatedConstraints: CandidateConstraints
): { baselineCount: number; simulatedCount: number; additionalJobs: number } {
  const baselineCount = countFeasible(candidate, allJobs);
  const simulatedCount = countFeasible(withConstraints(candidate, simulatedConstraints), allJobs);

  return {
    baselineCount,
    simulatedCount,
    additionalJobs: simulatedCount - baselineCount,
  };
}
