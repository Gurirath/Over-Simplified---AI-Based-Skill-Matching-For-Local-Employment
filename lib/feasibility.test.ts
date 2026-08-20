import { describe, expect, it } from "vitest";
import { checkFeasibility, filterFeasibleJobs } from "./feasibility";
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
      maxCommuteMinutes: 45,
      availableModes: ["walk", "bus"],
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
    location: { lat: 12.9698, lng: 79.1325 }, // same point as candidate
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

describe("checkFeasibility", () => {
  it("is feasible with no reasons when every gate passes", () => {
    const result = checkFeasibility(makeCandidate(), makeJob());

    expect(result.feasible).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.jobId).toBe("JOB_1");
    expect(result.bestCommute).not.toBeNull();
  });

  it("fires salary_below_floor when salaryMax is under the candidate's floor", () => {
    const candidate = makeCandidate({
      constraints: { ...makeCandidate().constraints, minMonthlySalary: 11000 },
    });
    const job = makeJob({ salaryMax: 9000 });

    const result = checkFeasibility(candidate, job);

    expect(result.feasible).toBe(false);
    expect(result.reasons).toContain("salary_below_floor");
  });

  it("fires commute_too_long when the best commute exceeds maxCommuteMinutes", () => {
    const candidate = makeCandidate();
    // ~55.6km straight-line north, only walk/bus available -> well over 45 min ceiling.
    const job = makeJob({ location: { lat: 13.4698, lng: 79.1325 } });

    const result = checkFeasibility(candidate, job);

    expect(result.feasible).toBe(false);
    expect(result.reasons).toContain("commute_too_long");
    expect(result.reasons).not.toContain("no_transport_route");
    expect(result.bestCommute).not.toBeNull();
  });

  it("fires no_transport_route when the candidate has no available transport modes", () => {
    const candidate = makeCandidate({
      constraints: { ...makeCandidate().constraints, availableModes: [] },
    });

    const result = checkFeasibility(candidate, makeJob());

    expect(result.feasible).toBe(false);
    expect(result.reasons).toContain("no_transport_route");
    expect(result.reasons).not.toContain("commute_too_long");
    expect(result.bestCommute).toBeNull();
  });

  it("does not fire schedule_conflict when day coverage is exactly at the 50% threshold", () => {
    const candidate = makeCandidate(); // available Mon-Fri only
    // 4 shift days, 2 (Mon, Tue) fall inside Mon-Fri -> exactly 50% day coverage.
    const job = makeJob({ shift: { startMin: 780, endMin: 1200, days: [0, 1, 2, 6] } });

    const result = checkFeasibility(candidate, job);

    expect(result.reasons).not.toContain("schedule_conflict");
  });

  it("fires schedule_conflict when day coverage falls below the 50% threshold", () => {
    const candidate = makeCandidate(); // available Mon-Fri only
    // 3 shift days, only 1 (Mon) falls inside Mon-Fri -> 33% day coverage.
    const job = makeJob({ shift: { startMin: 780, endMin: 1200, days: [0, 1, 6] } });

    const result = checkFeasibility(candidate, job);

    expect(result.feasible).toBe(false);
    expect(result.reasons).toContain("schedule_conflict");
  });

  it("does not fire schedule_conflict when time coverage is exactly at the 75% threshold", () => {
    const candidate = makeCandidate(); // available 12:00-22:00 (720-1320)
    // Shift 10:00-18:00 (480min). Overlap with 12:00-22:00 is 12:00-18:00 = 360min -> exactly 75%.
    const job = makeJob({ shift: { startMin: 600, endMin: 1080, days: [1, 2, 3, 4, 5] } });

    const result = checkFeasibility(candidate, job);

    expect(result.reasons).not.toContain("schedule_conflict");
  });

  it("fires schedule_conflict when time coverage falls below the 75% threshold", () => {
    const candidate = makeCandidate({
      constraints: {
        ...makeCandidate().constraints,
        availability: {
          ...makeCandidate().constraints.availability,
          earliestStartMin: 1020, // 17:00
          latestEndMin: 1260, // 21:00
        },
      },
    }); // available 17:00-21:00 only
    // Shift 09:00-18:00 (540min). Overlap with 17:00-21:00 is 17:00-18:00 = 60min -> 11% coverage.
    const job = makeJob({ shift: { startMin: 540, endMin: 1080, days: [1, 2, 3, 4, 5] } });

    const result = checkFeasibility(candidate, job);

    expect(result.feasible).toBe(false);
    expect(result.reasons).toContain("schedule_conflict");
  });

  it("fires insufficient_hours when hoursPerWeek is below the candidate's minimum", () => {
    const candidate = makeCandidate(); // minHoursPerWeek 24
    const job = makeJob({ hoursPerWeek: 10 });

    const result = checkFeasibility(candidate, job);

    expect(result.feasible).toBe(false);
    expect(result.reasons).toContain("insufficient_hours");
  });

  it("fires missing_hard_eligibility when the candidate lacks a required credential", () => {
    const candidate = makeCandidate(); // no credentials
    const job = makeJob({ hardEligibility: ["driving_licence_lmv"] });

    const result = checkFeasibility(candidate, job);

    expect(result.feasible).toBe(false);
    expect(result.reasons).toContain("missing_hard_eligibility");
  });

  it("does not fire missing_hard_eligibility when the candidate holds the required credential", () => {
    const candidate = makeCandidate({
      constraints: { ...makeCandidate().constraints, credentials: ["driving_licence_lmv"] },
    });
    const job = makeJob({ hardEligibility: ["driving_licence_lmv"] });

    const result = checkFeasibility(candidate, job);

    expect(result.reasons).not.toContain("missing_hard_eligibility");
  });

  it("collects every failing reason at once, not just the first", () => {
    const candidate = makeCandidate();
    const job = makeJob({
      salaryMax: 9000,
      hoursPerWeek: 10,
      hardEligibility: ["driving_licence_lmv"],
    });

    const result = checkFeasibility(candidate, job);

    expect(result.feasible).toBe(false);
    expect(result.reasons).toEqual(
      expect.arrayContaining(["salary_below_floor", "insufficient_hours", "missing_hard_eligibility"])
    );
  });
});

describe("filterFeasibleJobs", () => {
  it("returns one result per job, preserving order", () => {
    const candidate = makeCandidate();
    const feasibleJob = makeJob({ id: "JOB_OK" });
    const infeasibleJob = makeJob({ id: "JOB_BAD", salaryMax: 9000 });

    const results = filterFeasibleJobs(candidate, [feasibleJob, infeasibleJob]);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ jobId: "JOB_OK", feasible: true });
    expect(results[1]).toMatchObject({ jobId: "JOB_BAD", feasible: false });
  });
});
