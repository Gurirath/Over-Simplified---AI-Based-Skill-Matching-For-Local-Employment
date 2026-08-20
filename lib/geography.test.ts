import { describe, expect, it } from "vitest";
import { employerMix, employersWithinReach } from "./geography";
import type { Candidate, Employer } from "./types";

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "CAND_1",
    displayName: "Test Candidate",
    location: { lat: 12.9698, lng: 79.1325 }, // Katpadi
    rawStory: "story",
    skillClaims: [],
    constraints: {
      minMonthlySalary: 11000,
      maxCommuteMinutes: 45,
      availableModes: ["walk", "bus"],
      availability: {
        earliestStartMin: 480,
        latestEndMin: 1200,
        minHoursPerWeek: 20,
        maxHoursPerWeek: 48,
        availableDays: [1, 2, 3, 4, 5, 6],
      },
      credentials: [],
    },
    ...overrides,
  };
}

function makeEmployer(overrides: Partial<Employer> = {}): Employer {
  return {
    id: "OSM_NODE_1",
    name: "Test Employer",
    osmType: "shop=bakery",
    lat: 12.9698,
    lng: 79.1325,
    employerType: "bakery",
    ...overrides,
  };
}

describe("employersWithinReach", () => {
  it("includes an employer at the candidate's exact location", () => {
    const candidate = makeCandidate();
    const nearby = makeEmployer({ id: "NEAR", lat: 12.9698, lng: 79.1325 });

    const result = employersWithinReach(candidate, [nearby]);

    expect(result.map((e) => e.id)).toEqual(["NEAR"]);
  });

  it("excludes an employer whose commute exceeds maxCommuteMinutes", () => {
    const candidate = makeCandidate({
      constraints: { ...makeCandidate().constraints, maxCommuteMinutes: 45, availableModes: ["walk", "bus"] },
    });
    // ~25.7km away -> well over 45 minutes by walk or bus.
    const far = makeEmployer({ id: "FAR", lat: 13.2, lng: 79.1325 });

    const result = employersWithinReach(candidate, [far]);

    expect(result).toEqual([]);
  });

  it("excludes every employer when the candidate has no available transport modes", () => {
    const candidate = makeCandidate({
      constraints: { ...makeCandidate().constraints, availableModes: [] },
    });
    const nearby = makeEmployer({ id: "NEAR", lat: 12.9698, lng: 79.1325 });

    const result = employersWithinReach(candidate, [nearby]);

    expect(result).toEqual([]);
  });

  it("uses the candidate's fastest available mode, not just the first listed", () => {
    // ~4.4km away: too far to walk (45km/h... no, 4.5km/h) inside 45 minutes,
    // comfortably reachable by two_wheeler.
    const candidate = makeCandidate({
      constraints: {
        ...makeCandidate().constraints,
        maxCommuteMinutes: 30,
        availableModes: ["walk", "two_wheeler"],
      },
    });
    const midRange = makeEmployer({ id: "MID", lat: 13.01, lng: 79.1325 });

    const result = employersWithinReach(candidate, [midRange]);

    expect(result.map((e) => e.id)).toEqual(["MID"]);
  });

  it("returns an empty array for an empty employer list", () => {
    expect(employersWithinReach(makeCandidate(), [])).toEqual([]);
  });
});

describe("employerMix", () => {
  it("counts employers by type", () => {
    const employers = [
      makeEmployer({ id: "1", employerType: "bakery" }),
      makeEmployer({ id: "2", employerType: "bakery" }),
      makeEmployer({ id: "3", employerType: "hotel" }),
      makeEmployer({ id: "4", employerType: "salon" }),
    ];

    expect(employerMix(employers)).toEqual({ bakery: 2, hotel: 1, salon: 1 });
  });

  it("omits types with zero employers rather than reporting zero counts", () => {
    const employers = [makeEmployer({ employerType: "pharmacy" })];

    const mix = employerMix(employers);

    expect(mix).toEqual({ pharmacy: 1 });
    expect(mix.kirana).toBeUndefined();
  });

  it("returns an empty object for an empty employer list", () => {
    expect(employerMix([])).toEqual({});
  });
});
