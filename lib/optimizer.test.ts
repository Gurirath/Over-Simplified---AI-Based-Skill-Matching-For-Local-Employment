import { describe, expect, it } from "vitest";
import {
  missingSkills,
  computeOpportunitySnapshot,
  pruneSkillUniverse,
  recommendSkillBundles,
  computeNearMissFrontier,
  computeNearMissBuckets,
} from "./optimizer";
import type { Job } from "./types";

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
    salaryMin: 10000,
    salaryMax: 10000,
    shift: { startMin: 780, endMin: 1200, days: [1, 2, 3, 4, 5] },
    hoursPerWeek: 40,
    hardEligibility: [],
    minExperienceMonths: 0,
    isSynthetic: true,
    ...overrides,
  };
}

describe("missingSkills", () => {
  it("returns requiredSkills the candidate does not hold", () => {
    const job = makeJob({ requiredSkills: ["SKILL_A", "SKILL_B"] });

    expect(missingSkills(job, new Set(["SKILL_A"]))).toEqual(["SKILL_B"]);
  });

  it("returns an empty array when all required skills are held", () => {
    const job = makeJob({ requiredSkills: ["SKILL_A", "SKILL_B"] });

    expect(missingSkills(job, new Set(["SKILL_A", "SKILL_B"]))).toEqual([]);
  });

  it("returns an empty array when the job requires nothing", () => {
    const job = makeJob({ requiredSkills: [] });

    expect(missingSkills(job, new Set())).toEqual([]);
  });
});

describe("computeOpportunitySnapshot", () => {
  it("counts feasible jobs and the subset that is fully qualified", () => {
    const qualified = makeJob({ id: "JOB_QUALIFIED", requiredSkills: ["SKILL_A"] });
    const notQualified = makeJob({ id: "JOB_NOT_QUALIFIED", requiredSkills: ["SKILL_B"] });

    const snapshot = computeOpportunitySnapshot([qualified, notQualified], new Set(["SKILL_A"]));

    expect(snapshot.feasibleCount).toBe(2);
    expect(snapshot.qualifiedCount).toBe(1);
    expect(snapshot.qualifiedJobIds).toEqual(["JOB_QUALIFIED"]);
  });

  it("returns null median salary when nothing is qualified", () => {
    const job = makeJob({ requiredSkills: ["SKILL_A"] });

    const snapshot = computeOpportunitySnapshot([job], new Set());

    expect(snapshot.qualifiedCount).toBe(0);
    expect(snapshot.medianSalary).toBeNull();
  });

  it("computes the median of (salaryMin + salaryMax) / 2 across qualified jobs", () => {
    const jobs = [
      makeJob({ id: "JOB_LOW", requiredSkills: [], salaryMin: 8000, salaryMax: 8000 }),
      makeJob({ id: "JOB_MID", requiredSkills: [], salaryMin: 10000, salaryMax: 10000 }),
      makeJob({ id: "JOB_HIGH", requiredSkills: [], salaryMin: 20000, salaryMax: 20000 }),
    ];

    const snapshot = computeOpportunitySnapshot(jobs, new Set());

    expect(snapshot.medianSalary).toBe(10000);
  });

  it("averages the two middle salaries for an even-sized qualified set", () => {
    const jobs = [
      makeJob({ id: "JOB_A", requiredSkills: [], salaryMin: 8000, salaryMax: 8000 }),
      makeJob({ id: "JOB_B", requiredSkills: [], salaryMin: 12000, salaryMax: 12000 }),
    ];

    const snapshot = computeOpportunitySnapshot(jobs, new Set());

    expect(snapshot.medianSalary).toBe(10000);
  });
});

describe("pruneSkillUniverse", () => {
  it("returns the deduped, sorted union of missing skills across feasible jobs", () => {
    const jobs = [
      makeJob({ id: "JOB_1", requiredSkills: ["SKILL_TALLY", "SKILL_EXCEL"] }),
      makeJob({ id: "JOB_2", requiredSkills: ["SKILL_EXCEL", "SKILL_GST"] }),
    ];

    expect(pruneSkillUniverse(jobs, new Set())).toEqual(["SKILL_EXCEL", "SKILL_GST", "SKILL_TALLY"]);
  });

  it("excludes skills the candidate already holds", () => {
    const jobs = [makeJob({ requiredSkills: ["SKILL_TALLY", "SKILL_EXCEL"] })];

    expect(pruneSkillUniverse(jobs, new Set(["SKILL_EXCEL"]))).toEqual(["SKILL_TALLY"]);
  });

  it("excludes fully-qualified jobs from contributing any skills", () => {
    const jobs = [makeJob({ requiredSkills: ["SKILL_TALLY"] })];

    expect(pruneSkillUniverse(jobs, new Set(["SKILL_TALLY"]))).toEqual([]);
  });
});

describe("computeNearMissFrontier", () => {
  it("includes feasible jobs missing exactly one required skill", () => {
    const jobs = [
      makeJob({ id: "JOB_NEAR", requiredSkills: ["SKILL_A", "SKILL_B"] }),
      makeJob({ id: "JOB_FAR", requiredSkills: ["SKILL_A", "SKILL_B", "SKILL_C"] }),
      makeJob({ id: "JOB_QUALIFIED", requiredSkills: ["SKILL_A"] }),
    ];

    const frontier = computeNearMissFrontier(jobs, new Set(["SKILL_A"]));

    expect(frontier).toEqual([{ jobId: "JOB_NEAR", missingSkillId: "SKILL_B" }]);
  });

  it("returns an empty array when no job is exactly one skill away", () => {
    const jobs = [makeJob({ requiredSkills: ["SKILL_A", "SKILL_B", "SKILL_C"] })];

    expect(computeNearMissFrontier(jobs, new Set())).toEqual([]);
  });
});

describe("computeNearMissBuckets", () => {
  it("buckets jobs by exactly 1, exactly 2, and 3+ missing required skills", () => {
    const jobs = [
      makeJob({ id: "JOB_1AWAY", requiredSkills: ["SKILL_A", "SKILL_B"] }),
      makeJob({ id: "JOB_2AWAY", requiredSkills: ["SKILL_A", "SKILL_B", "SKILL_C"] }),
      makeJob({ id: "JOB_3AWAY", requiredSkills: ["SKILL_A", "SKILL_B", "SKILL_C", "SKILL_D"] }),
      makeJob({ id: "JOB_QUALIFIED", requiredSkills: ["SKILL_A"] }),
    ];

    const buckets = computeNearMissBuckets(jobs, new Set(["SKILL_A"]));

    expect(buckets).toEqual([
      { bucket: "1_skill", jobIds: ["JOB_1AWAY"] },
      { bucket: "2_skills", jobIds: ["JOB_2AWAY"] },
      { bucket: "3_plus_skills", jobIds: ["JOB_3AWAY"] },
    ]);
  });

  it("agrees with computeNearMissFrontier on the 1-skill bucket", () => {
    const jobs = [
      makeJob({ id: "JOB_NEAR", requiredSkills: ["SKILL_A", "SKILL_B"] }),
      makeJob({ id: "JOB_FAR", requiredSkills: ["SKILL_A", "SKILL_B", "SKILL_C"] }),
    ];
    const held = new Set(["SKILL_A"]);

    const frontier = computeNearMissFrontier(jobs, held);
    const buckets = computeNearMissBuckets(jobs, held);
    const oneSkillBucket = buckets.find((b) => b.bucket === "1_skill")!;

    expect(oneSkillBucket.jobIds).toEqual(frontier.map((f) => f.jobId));
  });

  it("omits fully-qualified jobs from every bucket", () => {
    const jobs = [makeJob({ requiredSkills: ["SKILL_A"] })];

    const buckets = computeNearMissBuckets(jobs, new Set(["SKILL_A"]));

    expect(buckets.every((b) => b.jobIds.length === 0)).toBe(true);
  });

  it("returns all three buckets, even when empty, in a stable order", () => {
    const buckets = computeNearMissBuckets([], new Set());

    expect(buckets.map((b) => b.bucket)).toEqual(["1_skill", "2_skills", "3_plus_skills"]);
  });
});

describe("recommendSkillBundles", () => {
  it("ranks a higher jobsUnlocked/hour bundle above a lower one", () => {
    const cheapWin = makeJob({ id: "JOB_CHEAP", requiredSkills: ["SKILL_CHEAP"] });
    const expensiveWin = makeJob({ id: "JOB_EXPENSIVE", requiredSkills: ["SKILL_EXPENSIVE"] });
    const learnHours = new Map([
      ["SKILL_CHEAP", 2],
      ["SKILL_EXPENSIVE", 20],
    ]);

    const bundles = recommendSkillBundles([cheapWin, expensiveWin], new Set(), learnHours, 1);

    expect(bundles[0].skillIds).toEqual(["SKILL_CHEAP"]);
    expect(bundles[0].jobsPer10Hours).toBeCloseTo((1 / 2) * 10, 5);
  });

  it("breaks ties in jobsUnlocked/hour by the median salary of the newly unlocked jobs", () => {
    const lowerPay = makeJob({
      id: "JOB_LOW_PAY",
      requiredSkills: ["SKILL_A"],
      salaryMin: 10000,
      salaryMax: 10000,
    });
    const higherPay = makeJob({
      id: "JOB_HIGH_PAY",
      requiredSkills: ["SKILL_B"],
      salaryMin: 20000,
      salaryMax: 20000,
    });
    const learnHours = new Map([
      ["SKILL_A", 5],
      ["SKILL_B", 5],
    ]);

    const bundles = recommendSkillBundles([lowerPay, higherPay], new Set(), learnHours, 1);

    // Both singleton bundles unlock exactly 1 job for 5 hours -> identical jobsPer10Hours.
    expect(bundles[0].jobsPer10Hours).toBeCloseTo(bundles[1].jobsPer10Hours, 5);
    expect(bundles[0].skillIds).toEqual(["SKILL_B"]);
  });

  it("computes medianSalaryBefore/After from the overall qualified-job snapshot, not just the new bundle", () => {
    const alreadyQualified = makeJob({
      id: "JOB_ALREADY",
      requiredSkills: [],
      salaryMin: 8000,
      salaryMax: 8000,
    });
    const unlockedByBundle = makeJob({
      id: "JOB_NEW",
      requiredSkills: ["SKILL_A"],
      salaryMin: 12000,
      salaryMax: 12000,
    });
    const learnHours = new Map([["SKILL_A", 4]]);

    const bundles = recommendSkillBundles([alreadyQualified, unlockedByBundle], new Set(), learnHours, 1);
    const bundle = bundles.find((b) => b.skillIds.includes("SKILL_A"))!;

    expect(bundle.medianSalaryBefore).toBe(8000);
    expect(bundle.medianSalaryAfter).toBe(10000);
  });

  it("handles a Tally+GST style joint requirement where exact enumeration beats greedy", () => {
    // A single job needs BOTH skills. Neither skill alone unlocks anything,
    // so a greedy hill-climber sees two zero-gain first moves and has no
    // signal to prefer either one, let alone discover the pair. Exact
    // enumeration evaluates the pair directly and ranks it first.
    const accountingJob = makeJob({
      id: "JOB_ACCOUNTING",
      requiredSkills: ["SKILL_TALLY", "SKILL_GST"],
    });
    const learnHours = new Map([
      ["SKILL_TALLY", 6],
      ["SKILL_GST", 4],
    ]);

    const bundles = recommendSkillBundles([accountingJob], new Set(), learnHours, 2);

    const singletonBundles = bundles.filter((b) => b.skillIds.length === 1);
    const pairBundle = bundles.find(
      (b) => b.skillIds.length === 2 && b.skillIds.includes("SKILL_TALLY") && b.skillIds.includes("SKILL_GST")
    );

    // Greedy's evidence at step 1: every singleton move unlocks zero jobs.
    expect(singletonBundles.every((b) => b.jobsUnlocked === 0)).toBe(true);
    expect(singletonBundles.map((b) => b.jobsPer10Hours)).toEqual([0, 0]);

    // Exact enumeration finds the joint bundle and ranks it above every singleton.
    expect(pairBundle).toBeDefined();
    expect(pairBundle!.jobsUnlocked).toBe(1);
    expect(pairBundle!.newlyUnlockedJobIds).toEqual(["JOB_ACCOUNTING"]);
    expect(bundles[0]).toBe(pairBundle);
  });

  it("never proposes a bundle larger than k", () => {
    const jobs = [makeJob({ requiredSkills: ["SKILL_A", "SKILL_B", "SKILL_C", "SKILL_D"] })];
    const learnHours = new Map([
      ["SKILL_A", 1],
      ["SKILL_B", 1],
      ["SKILL_C", 1],
      ["SKILL_D", 1],
    ]);

    const bundles = recommendSkillBundles(jobs, new Set(), learnHours, 3);

    expect(bundles.every((b) => b.skillIds.length <= 3)).toBe(true);
    expect(bundles.some((b) => b.skillIds.length === 3)).toBe(true);
  });
});
