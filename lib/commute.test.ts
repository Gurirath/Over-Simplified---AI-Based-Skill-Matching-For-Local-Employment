import { describe, expect, it } from "vitest";
import { estimateCommute, bestCommute } from "./commute";
import type { GeoPoint } from "./types";

const ORIGIN: GeoPoint = { lat: 0, lng: 0 };
const ONE_DEGREE_LAT_NORTH: GeoPoint = { lat: 1, lng: 0 };

describe("estimateCommute", () => {
  it("returns zero distance and only the first/last-mile penalty for the same point", () => {
    const result = estimateCommute(ORIGIN, ORIGIN, "walk");

    expect(result.straightLineKm).toBe(0);
    expect(result.roadKm).toBe(0);
    expect(result.minutes).toBeCloseTo(8, 5);
    expect(result.mode).toBe("walk");
  });

  it("applies the 1.35 road factor to the haversine distance", () => {
    const result = estimateCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, "two_wheeler");

    expect(result.straightLineKm).toBeCloseTo(111.19492664455873, 5);
    expect(result.roadKm).toBeCloseTo(150.1131509701543, 5);
  });

  it("computes minutes from roadKm, mode speed, and the fixed 8-minute penalty", () => {
    const result = estimateCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, "two_wheeler");

    expect(result.minutes).toBeCloseTo(383.2828774253857, 5);
  });

  it.each([
    ["walk", 2009.5086796020573],
    ["cycle", 758.5657548507714],
    ["bus", 570.9243161380786],
    ["two_wheeler", 383.2828774253857],
  ] as const)("uses the correct speed band for mode=%s", (mode, expectedMinutes) => {
    const result = estimateCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, mode);

    expect(result.minutes).toBeCloseTo(expectedMinutes, 5);
  });
});

describe("bestCommute", () => {
  it("returns null when no transport modes are available", () => {
    const result = bestCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, []);

    expect(result).toBeNull();
  });

  it("returns the estimate for the only mode when a single mode is available", () => {
    const result = bestCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, ["bus"]);

    expect(result).toEqual(estimateCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, "bus"));
  });

  it("picks the fastest mode (lowest minutes) among the available modes", () => {
    const result = bestCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, ["walk", "cycle", "bus", "two_wheeler"]);

    expect(result).toEqual(estimateCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, "two_wheeler"));
  });

  it("does not pick a slower mode even if it is listed first", () => {
    const result = bestCommute(ORIGIN, ONE_DEGREE_LAT_NORTH, ["walk", "bus"]);

    expect(result?.mode).toBe("bus");
  });
});
