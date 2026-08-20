/**
 * Employer geography — pure functions over data/employers.json, real
 * OpenStreetMap business locations (scripts/fetch-employers.ts). These are
 * BUSINESS LOCATIONS, not job vacancies: no salary, no shift, no
 * requiredSkills. Do not present them as openings anywhere in the UI.
 *
 * Deliberately not touching lib/feasibility.ts, lib/scoring.ts or
 * lib/optimizer.ts — this is a separate, additive layer.
 */

import { bestCommute } from "./commute";
import type { Candidate, Employer, EmployerType } from "./types";

/** Employers reachable within the candidate's commute ceiling, using her available modes. */
export function employersWithinReach(candidate: Candidate, employers: Employer[]): Employer[] {
  const { location, constraints } = candidate;

  return employers.filter((employer) => {
    const commute = bestCommute(
      location,
      { lat: employer.lat, lng: employer.lng },
      constraints.availableModes
    );
    return commute !== null && commute.minutes <= constraints.maxCommuteMinutes;
  });
}

/** Counts of employers by type — only types actually present appear as keys. */
export function employerMix(employers: Employer[]): Partial<Record<EmployerType, number>> {
  const counts: Partial<Record<EmployerType, number>> = {};

  for (const employer of employers) {
    counts[employer.employerType] = (counts[employer.employerType] ?? 0) + 1;
  }

  return counts;
}
