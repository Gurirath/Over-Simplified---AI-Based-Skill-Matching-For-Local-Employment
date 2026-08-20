/**
 * Commute estimation — haversine + fixed speed bands. No routing API.
 * See CLAUDE.md §10. Kept isolated so it can be swapped for a real
 * routing API later without touching feasibility or scoring.
 */

import type { GeoPoint, TransportMode, CommuteEstimate } from "./types";

const EARTH_RADIUS_KM = 6371;
const ROAD_FACTOR = 1.35;
const FIRST_LAST_MILE_MIN = 8;

const MODE_SPEED_KMH: Record<TransportMode, number> = {
  walk: 4.5,
  cycle: 12,
  bus: 16,
  two_wheeler: 24,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/** Estimate commute time for a single transport mode. */
export function estimateCommute(
  from: GeoPoint,
  to: GeoPoint,
  mode: TransportMode
): CommuteEstimate {
  const straightLineKm = haversineKm(from, to);
  const roadKm = straightLineKm * ROAD_FACTOR;
  const minutes = (roadKm / MODE_SPEED_KMH[mode]) * 60 + FIRST_LAST_MILE_MIN;

  return { mode, straightLineKm, roadKm, minutes };
}

/** Pick the fastest available mode within the candidate's constraints. */
export function bestCommute(
  from: GeoPoint,
  to: GeoPoint,
  availableModes: TransportMode[]
): CommuteEstimate | null {
  let best: CommuteEstimate | null = null;

  for (const mode of availableModes) {
    const estimate = estimateCommute(from, to, mode);
    if (best === null || estimate.minutes < best.minutes) {
      best = estimate;
    }
  }

  return best;
}
