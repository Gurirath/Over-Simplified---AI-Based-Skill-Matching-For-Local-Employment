/**
 * Commute estimation — haversine + fixed speed bands. No routing API.
 * See CLAUDE.md §10. Kept isolated so it can be swapped for a real
 * routing API later without touching feasibility or scoring.
 */

import type { GeoPoint, TransportMode, CommuteEstimate } from "./types";

/** Estimate commute time for a single transport mode. */
export function estimateCommute(
  from: GeoPoint,
  to: GeoPoint,
  mode: TransportMode
): CommuteEstimate {
  throw new Error("Not implemented");
}

/** Pick the fastest available mode within the candidate's constraints. */
export function bestCommute(
  from: GeoPoint,
  to: GeoPoint,
  availableModes: TransportMode[]
): CommuteEstimate | null {
  throw new Error("Not implemented");
}
