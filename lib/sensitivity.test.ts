import { describe, expect, it } from "vitest";
import { getConstraintSensitivitySteps, simulateCustomConstraints } from "./sensitivity";
import type { Candidate, Job } from "./types";

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "CAND_1",
    displayName: "Test Candidate",
    location: { lat: 12.9698, lng: 79.1325 },
    rawStory: "story",
    skillClaims: [],
    constraints: {
      minMonthlySalary: 11000,
      maxCommuteMinutes: 30,
      availableModes: ["walk"],
      availability: {
        earliestStartMin: 720, // 12:00
        latestEndMin: 1320, // 22:00
        minHoursPerWeek: 24,
        maxHoursPerWeek: 48,
        availableDays: [1, 2, 3, 4, 5], // Mon-Fri
      },
      credentials: [],
    },
    ...overrides,
  };
}

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "JOB_1",
    title: "Test Job",
    employerName: "Test Employer",
    employerType: "kirana",
    location: { lat: 12.9698, lng: 79.1325 },
    areaName: "Katpadi",
    requiredSkills: [],
    preferredSkills: [],
    salaryMin: 11000,
    salaryMax: 15000,
    shift: { startMin: 780, endMin: 1200, days: [1, 2, 3, 4, 5] },
    hoursPerWeek: 40,
    hardEligibility: [],
    minExperienceMonths: 0,
    isSynthetic: true,
    ...overrides,
  };
}

describe("getConstraintSensitivitySteps", () => {
  it("reports one step per constraint dimension", () => {
    const steps = getConstraintSensitivitySteps(makeCandidate(), [makeJob()]);
    const names = steps.map((s) => s.constraintName);

    expect(names).toEqual(
      expect.arrayContaining([
        "Maximum commute",
        "Earliest start time",
        "Latest end time",
        "Transport modes",
        "Minimum salary",
      ])
    );
  });

  it("never reports a negative additionalJobs count", () => {
    const steps = getConstraintSensitivitySteps(makeCandidate(), [makeJob(), makeJob({ id: "JOB_2" })]);

    for (const step of steps) {
      expect(step.additionalJobs).toBeGreaterThanOrEqual(0);
    }
  });

  it("unlocks a job that only fails on the relaxed dimension", () => {
    // Job needs 40h/week min via hoursPerWeek gate — untouched here — but fails
    // salary_below_floor by exactly the relaxation step (1000).
    const candidate = makeCandidate({
      constraints: { ...makeCandidate().constraints, minMonthlySalary: 11000 },
    });
    const job = makeJob({ salaryMax: 10500 }); // below 11000 floor, above 10000 relaxed floor

    const steps = getConstraintSensitivitySteps(candidate, [job]);
    const salaryStep = steps.find((s) => s.constraintName === "Minimum salary")!;

    expect(salaryStep.additionalJobs).toBe(1);
    expect(salaryStep.newFeasibleCount).toBe(1);
  });

  it("omits the transport-modes step once every mode is already available", () => {
    const candidate = makeCandidate({
      constraints: {
        ...makeCandidate().constraints,
        availableModes: ["walk", "cycle", "bus", "two_wheeler"],
      },
    });

    const steps = getConstraintSensitivitySteps(candidate, [makeJob()]);

    expect(steps.some((s) => s.constraintName === "Transport modes")).toBe(false);
  });

  it("does not mutate the input candidate", () => {
    const candidate = makeCandidate();
    const snapshot = JSON.parse(JSON.stringify(candidate));

    getConstraintSensitivitySteps(candidate, [makeJob()]);

    expect(candidate).toEqual(snapshot);
  });
});

describe("simulateCustomConstraints", () => {
  it("reports zero delta when simulated constraints equal the baseline", () => {
    const candidate = makeCandidate();
    const result = simulateCustomConstraints(candidate, [makeJob()], candidate.constraints);

    expect(result.additionalJobs).toBe(0);
    expect(result.simulatedCount).toBe(result.baselineCount);
  });

  it("reports a negative delta when constraints are tightened", () => {
    const candidate = makeCandidate();
    const tightened = { ...candidate.constraints, maxCommuteMinutes: 0 };

    const result = simulateCustomConstraints(candidate, [makeJob()], tightened);

    expect(result.additionalJobs).toBeLessThanOrEqual(0);
  });

  it("reports a positive delta when constraints are loosened enough to pass a previously-failing job", () => {
    const candidate = makeCandidate({
      constraints: { ...makeCandidate().constraints, minMonthlySalary: 20000 },
    });
    const job = makeJob({ salaryMax: 15000 }); // fails baseline 20000 floor
    const loosened = { ...candidate.constraints, minMonthlySalary: 10000 };

    const result = simulateCustomConstraints(candidate, [job], loosened);

    expect(result.baselineCount).toBe(0);
    expect(result.simulatedCount).toBe(1);
    expect(result.additionalJobs).toBe(1);
  });
});
