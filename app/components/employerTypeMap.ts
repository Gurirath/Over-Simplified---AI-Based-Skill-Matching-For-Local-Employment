/**
 * EmployerType is a closed vocabulary owned by lib/types.ts — ours wins
 * over reach-frontend's vocabulary (10 different, non-overlapping values).
 *
 * With the frontend merge, all live data (data/employers.json,
 * data/jobs.json, and LLM job extraction via lib/extract.ts's own
 * EMPLOYER_TYPES allowlist) already carries our vocabulary — no legacy
 * string should reach the UI in practice. LEGACY_EMPLOYER_TYPE_MAP and
 * normalizeEmployerType exist as an explicit, documented safety net so any
 * display or filter site that reads an EmployerType degrades to a real
 * value instead of an unrecognized string, rather than as something
 * expected to fire on the current data.
 */

import type { EmployerType } from "@/lib/types";

export const EMPLOYER_TYPE_LABELS: Record<EmployerType, string> = {
  kirana: "Kirana Store",
  bakery: "Bakery",
  medical_shop: "Medical Shop",
  auto_workshop: "Auto Workshop",
  tuition_centre: "Tuition Centre",
  warehouse: "Warehouse",
  salon: "Salon",
  hotel: "Hotel",
  school_office: "School Office",
  pharmacy: "Pharmacy",
  other: "Other",
};

export const EMPLOYER_TYPE_OPTIONS: EmployerType[] = [
  "kirana",
  "bakery",
  "medical_shop",
  "auto_workshop",
  "tuition_centre",
  "warehouse",
  "salon",
  "hotel",
  "school_office",
  "pharmacy",
  "other",
];

/** reach-frontend's old EmployerType vocabulary -> ours. Best-effort semantic mapping. */
export const LEGACY_EMPLOYER_TYPE_MAP: Record<string, EmployerType> = {
  workshop: "auto_workshop",
  retail: "kirana",
  agriculture: "other",
  logistics: "warehouse",
  health_clinic: "medical_shop",
  education: "tuition_centre",
  hospitality: "hotel",
  construction: "other",
  manufacturing: "other",
  public_service: "other",
};

const VALID_EMPLOYER_TYPES = new Set<string>(EMPLOYER_TYPE_OPTIONS);

/** Coerce any string (ours, legacy, or unknown) to a valid EmployerType. */
export function normalizeEmployerType(raw: string): EmployerType {
  if (VALID_EMPLOYER_TYPES.has(raw)) return raw as EmployerType;
  return LEGACY_EMPLOYER_TYPE_MAP[raw] ?? "other";
}

export function employerTypeLabel(raw: string): string {
  return EMPLOYER_TYPE_LABELS[normalizeEmployerType(raw)];
}
