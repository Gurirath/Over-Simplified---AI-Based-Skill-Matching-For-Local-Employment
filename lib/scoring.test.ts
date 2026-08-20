import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHTS, scoreJob } from "./scoring";
import type {
  Candidate,
  CommuteEstimate,
  FeasibilityResult,
  Job,
  SkillClaim,
} from "./types";

function claim(skillId: string, tier: SkillClaim["tier"]): SkillClaim {
  return {
    skillId,
    tier,
    evidenceSpan: "evidence",
    spanStart: 0,
    spanEnd: 8,
    userConfirmed: false,
  };
}

function buildCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "CAND_TEST",
    displayName: "Test Candidate",
    location: { lat: 12.97, lng: 79.13 },
    rawStory: "evidence of things done",
    skillClaims: [claim("SKILL_A", "stated"), claim("SKILL_B", "demonstrated"), claim("SKILL_C", "implied")],
    constraints: {
      minMonthlySalary: 10000,
      maxCommuteMinutes: 45,
      availableModes: ["walk", "bus"],
      availability: {
        earliestStartMin: 540,
        latestEndMin: 1080,
        minHoursPerWeek: 20,
        maxHoursPerWeek: 40,
        availableDays: [1, 2, 3, 4, 5],
      },
      credentials: [],
    },
    ...overrides,
  };
}

function buildJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "JOB_TEST",
    title: "Test Role",
    employerName: "Test Employer",
    employerType: "kirana",
    location: { lat: 12.97, lng: 79.13 },
    areaName: "Katpadi",
    requiredSkills: ["SKILL_A", "SKILL_B"],
    preferredSkills: ["SKILL_C"],
    salaryMin: 9000,
    salaryMax: 15000,
    shift: { startMin: 600, endMin: 1020, days: [1, 2, 3, 4, 5] },
    hoursPerWeek: 30,
    hardEligibility: [],
    minExperienceMonths: 0,
    isSynthetic: true,
    ...overrides,
  };
}

function buildCommute(overrides: Partial<CommuteEstimate> = {}): CommuteEstimate {
  return {
    mode: "walk",
    straightLineKm: 1,
    roadKm: 1.35,
    minutes: 20,
    ...overrides,
  };
}

function buildFeasibility(job: Job, overrides: Partial<FeasibilityResult> = {}): FeasibilityResult {
  return {
    jobId: job.id,
    feasible: true,
    reasons: [],
    bestCommute: buildCommute(),
    ...overrides,
  };
}

describe("DEFAULT_WEIGHTS", () => {
  it("sums to 1 so score stays in [0, 1]", () => {
    const sum =
      DEFAULT_WEIGHTS.skillCoverage +
      DEFAULT_WEIGHTS.experienceRelevance +
      DEFAULT_WEIGHTS.commuteMargin +
      DEFAULT_WEIGHTS.salaryHeadroom +
      DEFAULT_WEIGHTS.scheduleComfort;
    expect(sum).toBeCloseTo(1);
  });
});

describe("scoreJob — feasibility gate boundary", () => {
  it("throws if the job did not pass the feasibility gate", () => {
    const job = buildJob();
    const candidate = buildCandidate();
    const infeasible = buildFeasibility(job, { feasible: false, reasons: ["commute_too_long"], bestCommute: null });
    expect(() => scoreJob(candidate, job, infeasible)).toThrow();
  });

  it("throws if the feasibility result is for a different job", () => {
    const job = buildJob();
    const candidate = buildCandidate();
    const mismatched = buildFeasibility(buildJob({ id: "OTHER_JOB" }));
    expect(() => scoreJob(candidate, job, mismatched)).toThrow();
  });

  it("throws if weights sum to zero", () => {
    const job = buildJob();
    const candidate = buildCandidate();
    const feasibility = buildFeasibility(job);
    const zeroWeights = {
      skillCoverage: 0,
      experienceRelevance: 0,
      commuteMargin: 0,
      salaryHeadroom: 0,
      scheduleComfort: 0,
    };
    expect(() => scoreJob(candidate, job, feasibility, zeroWeights)).toThrow();
  });
});

describe("scoreJob — never reads the feasibility-only fields", () => {
  it("does not read candidate.constraints.minMonthlySalary or maxCommuteMinutes", () => {
    const job = buildJob();
    const feasibility = buildFeasibility(job);
    const base = buildCandidate();

    const guardedConstraints = new Proxy(base.constraints, {
      get(target, prop, receiver) {
        if (prop === "minMonthlySalary" || prop === "maxCommuteMinutes") {
          throw new Error(`scoring must not read candidate.constraints.${String(prop)} — that belongs to feasibility only (CLAUDE.md §3)`);
        }
        return Reflect.get(target, prop, receiver);
      },
    });
    const guardedCandidate: Candidate = { ...base, constraints: guardedConstraints };

    expect(() => scoreJob(guardedCandidate, job, feasibility)).not.toThrow();
  });
});

describe("scoreJob — component behavior", () => {
  it("every component carries a non-empty plain-language explanation", () => {
    const job = buildJob();
    const candidate = buildCandidate();
    const feasibility = buildFeasibility(job);
    const result = scoreJob(candidate, job, feasibility);

    expect(result.components).toHaveLength(5);
    for (const component of result.components) {
      expect(typeof component.explanation).toBe("string");
      expect(component.explanation.length).toBeGreaterThan(0);
    }
  });

  it("scores full skill coverage as 1 and computes qualifiedNow from required skills only", () => {
    const job = buildJob();
    const candidate = buildCandidate();
    const feasibility = buildFeasibility(job);
    const result = scoreJob(candidate, job, feasibility);

    const coverage = result.components.find((c) => c.key === "skillCoverage")!;
    expect(coverage.raw).toBe(1);
    expect(result.missingRequired).toEqual([]);
    expect(result.qualifiedNow).toBe(true);
  });

  it("scores zero skill coverage and relevance when the candidate holds none of the job's skills", () => {
    const job = buildJob();
    const candidate = buildCandidate({ skillClaims: [] });
    const feasibility = buildFeasibility(job);
    const result = scoreJob(candidate, job, feasibility);

    const coverage = result.components.find((c) => c.key === "skillCoverage")!;
    const relevance = result.components.find((c) => c.key === "experienceRelevance")!;
    expect(coverage.raw).toBe(0);
    expect(relevance.raw).toBe(0);
    expect(result.missingRequired).toEqual(["SKILL_A", "SKILL_B"]);
    expect(result.qualifiedNow).toBe(false);
  });

  it("weighs stated evidence above implied evidence in experienceRelevance", () => {
    const job = buildJob({ requiredSkills: ["SKILL_A"], preferredSkills: [] });
    const feasibility = buildFeasibility(job);

    const statedCandidate = buildCandidate({ skillClaims: [claim("SKILL_A", "stated")] });
    const impliedCandidate = buildCandidate({ skillClaims: [claim("SKILL_A", "implied")] });

    const statedResult = scoreJob(statedCandidate, job, feasibility);
    const impliedResult = scoreJob(impliedCandidate, job, feasibility);

    const statedRelevance = statedResult.components.find((c) => c.key === "experienceRelevance")!.raw;
    const impliedRelevance = impliedResult.components.find((c) => c.key === "experienceRelevance")!.raw;
    expect(statedRelevance).toBeGreaterThan(impliedRelevance);
  });

  it("rewards a shorter commute with a higher commuteMargin, independent of the candidate's personal ceiling", () => {
    const job = buildJob();
    const candidate = buildCandidate({ constraints: { ...buildCandidate().constraints, maxCommuteMinutes: 200 } });

    const nearFeasibility = buildFeasibility(job, { bestCommute: buildCommute({ minutes: 10 }) });
    const farFeasibility = buildFeasibility(job, { bestCommute: buildCommute({ minutes: 55 }) });

    const nearResult = scoreJob(candidate, job, nearFeasibility);
    const farResult = scoreJob(candidate, job, farFeasibility);

    const nearMargin = nearResult.components.find((c) => c.key === "commuteMargin")!.raw;
    const farMargin = farResult.components.find((c) => c.key === "commuteMargin")!.raw;
    expect(nearMargin).toBeGreaterThan(farMargin);
  });

  it("rewards higher pay with higher salaryHeadroom, independent of the candidate's personal floor", () => {
    const candidate = buildCandidate({ constraints: { ...buildCandidate().constraints, minMonthlySalary: 20000 } });

    const lowPayJob = buildJob({ id: "JOB_LOW", salaryMax: 9500 });
    const highPayJob = buildJob({ id: "JOB_HIGH", salaryMax: 21000 });

    const lowResult = scoreJob(candidate, lowPayJob, buildFeasibility(lowPayJob));
    const highResult = scoreJob(candidate, highPayJob, buildFeasibility(highPayJob));

    const lowHeadroom = lowResult.components.find((c) => c.key === "salaryHeadroom")!.raw;
    const highHeadroom = highResult.components.find((c) => c.key === "salaryHeadroom")!.raw;
    expect(highHeadroom).toBeGreaterThan(lowHeadroom);
  });

  it("scores full scheduleComfort when availability fully covers the shift and its days", () => {
    const job = buildJob({ shift: { startMin: 600, endMin: 900, days: [1, 2, 3] } });
    const candidate = buildCandidate({
      constraints: {
        ...buildCandidate().constraints,
        availability: {
          earliestStartMin: 540,
          latestEndMin: 1080,
          minHoursPerWeek: 20,
          maxHoursPerWeek: 40,
          availableDays: [1, 2, 3, 4, 5],
        },
      },
    });
    const result = scoreJob(candidate, job, buildFeasibility(job));
    const comfort = result.components.find((c) => c.key === "scheduleComfort")!;
    expect(comfort.raw).toBe(1);
  });

  it("scores partial scheduleComfort when only some rostered days overlap", () => {
    const job = buildJob({ shift: { startMin: 600, endMin: 900, days: [1, 2, 3, 4] } });
    const candidate = buildCandidate({
      constraints: {
        ...buildCandidate().constraints,
        availability: {
          earliestStartMin: 600,
          latestEndMin: 900,
          minHoursPerWeek: 20,
          maxHoursPerWeek: 40,
          availableDays: [1, 2],
        },
      },
    });
    const result = scoreJob(candidate, job, buildFeasibility(job));
    const comfort = result.components.find((c) => c.key === "scheduleComfort")!;
    expect(comfort.raw).toBeGreaterThan(0);
    expect(comfort.raw).toBeLessThan(1);
  });

  it("sums weighted components into the final score and normalizes weights that don't total 1", () => {
    const job = buildJob();
    const candidate = buildCandidate();
    const feasibility = buildFeasibility(job);

    const lopsidedWeights = {
      skillCoverage: 2,
      experienceRelevance: 2,
      commuteMargin: 2,
      salaryHeadroom: 2,
      scheduleComfort: 2,
    };
    const result = scoreJob(candidate, job, feasibility, lopsidedWeights);

    const expectedScore = result.components.reduce((sum, c) => sum + c.weighted, 0);
    expect(result.score).toBeCloseTo(expectedScore);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
