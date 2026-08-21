/**
 * Adapter layer between lib/ (our contract, untouched) and the merged UI.
 * None of this replaces lib/feasibility.ts, lib/scoring.ts, or
 * lib/optimizer.ts — it composes their exports into view-model shapes the
 * copied Vite components expect, and provides small pieces (human-readable
 * infeasibility sentences, skill-request aggregation) that neither lib/ nor
 * the original Vite lib had an equivalent for.
 */

import type {
  Candidate,
  EvidenceTier,
  FeasibilityResult,
  InfeasibilityReason,
  Job,
  TransportMode,
} from "@/lib/types";
import { checkFeasibility, filterFeasibleJobs } from "@/lib/feasibility";
import { computeOpportunitySnapshot, missingSkills } from "@/lib/optimizer";
import { getSkill } from "@/lib/normalize";
import { MODE_SPEED_KMH, ROAD_FACTOR, FIRST_LAST_MILE_MIN } from "@/lib/commute";
import type { EvaluatedJobView, FunnelStage, RequestedSkillItem } from "./dashboard-types";
import { getLocalizedTransportMode, type LanguageCode } from "./i18n";

// ── funnel ──────────────────────────────────────────────────────────────

/**
 * 3-stage funnel: Total -> Feasible -> Qualified. reach-frontend's 4th
 * "Qualified after verification" stage has no equivalent here — our model
 * has no per-job verificationRequired flag, only per-claim evidence tiers
 * (CLAUDE.md §5), which is a different axis entirely.
 */
export function buildFunnelStages(candidate: Candidate, allJobs: Job[]): FunnelStage[] {
  const feasibilityResults = filterFeasibleJobs(candidate, allJobs);
  const feasibleJobs = allJobs.filter((_, i) => feasibilityResults[i].feasible);
  const held = heldSkillIds(candidate);
  const snapshot = computeOpportunitySnapshot(feasibleJobs, held);

  return [
    {
      stage: "Total jobs",
      count: allJobs.length,
      description: "All recorded local opportunities across the region",
    },
    {
      stage: "Feasible",
      count: snapshot.feasibleCount,
      description: "Within commute reach, transport, salary floor and shift availability",
    },
    {
      stage: "Qualified",
      count: snapshot.qualifiedCount,
      description: "Feasible jobs matching every required skill you hold",
    },
  ];
}

export function heldSkillIds(candidate: Candidate): Set<string> {
  return new Set(
    candidate.skillClaims
      .filter((c) => c.tier !== "implied" || c.userConfirmed)
      .map((c) => c.skillId)
  );
}

// ── per-job evaluation ──────────────────────────────────────────────────

const REASON_LABELS: Record<InfeasibilityReason, string> = {
  salary_below_floor: "Pays below your salary floor",
  commute_too_long: "Commute exceeds your maximum",
  schedule_conflict: "Shift doesn't overlap your availability enough",
  insufficient_hours: "Offers fewer hours than your minimum",
  no_transport_route: "No available transport mode reaches this location",
  missing_hard_eligibility: "Requires a credential you don't hold",
};

function explainReason(
  reason: InfeasibilityReason,
  candidate: Candidate,
  job: Job,
  feasibility: FeasibilityResult
): string {
  const { constraints } = candidate;
  switch (reason) {
    case "salary_below_floor":
      return `Pays up to Rs${job.salaryMax.toLocaleString("en-IN")}/month, below your floor of Rs${constraints.minMonthlySalary.toLocaleString("en-IN")}/month.`;
    case "commute_too_long":
      return feasibility.bestCommute
        ? `Best commute is ${Math.round(feasibility.bestCommute.minutes)} min by ${feasibility.bestCommute.mode.replace("_", " ")}, over your ${constraints.maxCommuteMinutes} min limit.`
        : `Commute exceeds your ${constraints.maxCommuteMinutes} min limit.`;
    case "no_transport_route":
      return "None of your available transport modes reach this location in time.";
    case "schedule_conflict":
      return "Your available hours and days don't cover enough of this shift (needs at least 75% of the shift's hours and 50% of its rostered days).";
    case "insufficient_hours":
      return `Offers ${job.hoursPerWeek}h/week, below your minimum of ${constraints.availability.minHoursPerWeek}h/week.`;
    case "missing_hard_eligibility":
      return `Requires ${job.hardEligibility.join(", ")}, which you don't currently hold.`;
    default:
      return REASON_LABELS[reason];
  }
}

export function evaluateJob(candidate: Candidate, job: Job): EvaluatedJobView {
  const feasibility = checkFeasibility(candidate, job);
  const held = heldSkillIds(candidate);
  const missingRequired = missingSkills(job, held);

  return {
    job,
    feasibility,
    missingRequired,
    qualifiedNow: missingRequired.length === 0,
    reasonSentences: feasibility.reasons.map((r) => explainReason(r, candidate, job, feasibility)),
  };
}

export function evaluateAllJobs(candidate: Candidate, allJobs: Job[]): EvaluatedJobView[] {
  return allJobs.map((job) => evaluateJob(candidate, job));
}

// ── requested skills (aggregated by employerName — Job has no employerId FK) ──

export function computeRequestedSkills(feasibleJobs: Job[], limit = 6): RequestedSkillItem[] {
  const employersBySkill = new Map<string, Set<string>>();
  const jobCountBySkill = new Map<string, number>();

  for (const job of feasibleJobs) {
    for (const skillId of job.requiredSkills) {
      if (!employersBySkill.has(skillId)) {
        employersBySkill.set(skillId, new Set());
        jobCountBySkill.set(skillId, 0);
      }
      employersBySkill.get(skillId)!.add(job.employerName);
      jobCountBySkill.set(skillId, (jobCountBySkill.get(skillId) ?? 0) + 1);
    }
  }

  const items: RequestedSkillItem[] = [...employersBySkill.entries()].map(([skillId, employers]) => ({
    skillId,
    skillName: getSkill(skillId).canonicalName,
    employerCount: employers.size,
    jobCount: jobCountBySkill.get(skillId) ?? 0,
  }));

  return items.sort((a, b) => b.employerCount - a.employerCount).slice(0, limit);
}

// ── transport mode display ─────────────────────────────────────────────

export const ALL_TRANSPORT_MODES: TransportMode[] = ["walk", "cycle", "bus", "two_wheeler"];

export function transportModeLabel(mode: TransportMode, lang: LanguageCode = "en"): string {
  return getLocalizedTransportMode(mode, lang);
}

// ── time helpers (minutes-since-midnight <-> "HH:MM") ──────────────────

export function formatMinutesOfDay(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseMinutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// ── evidence tier display (CLAUDE.md §5 — tiers, never confidence scores) ──

export const EVIDENCE_TIER_LABELS: Record<EvidenceTier, string> = {
  stated: "Stated",
  demonstrated: "Demonstrated",
  implied: "Implied",
};

export const EVIDENCE_TIER_DESCRIPTIONS: Record<EvidenceTier, string> = {
  stated: "You named this skill directly.",
  demonstrated: "You described the activity, not the skill by name.",
  implied: "Inferred from context — confirm it to count it toward your matches.",
};

// ── day-of-week display ────────────────────────────────────────────────

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── map isochrone approximation ────────────────────────────────────────

/**
 * Straight-line radius (km) such that a job exactly at that distance would
 * take approximately maxCommuteMinutes via the candidate's fastest
 * available mode — inverting lib/commute.ts's estimateCommute formula.
 * This is an approximation for the map circle only: the real feasibility
 * gate (lib/feasibility.ts) evaluates actual per-job road distance and
 * mode choice, not this circle. Label it as an estimate in the UI.
 */
export function estimateIsochroneRadiusKm(candidate: Candidate): number {
  const { availableModes, maxCommuteMinutes } = candidate.constraints;
  if (availableModes.length === 0) return 0;

  const fastestSpeedKmh = Math.max(...availableModes.map((m) => MODE_SPEED_KMH[m]));
  const travelMinutes = Math.max(0, maxCommuteMinutes - FIRST_LAST_MILE_MIN);
  const roadKm = (fastestSpeedKmh * travelMinutes) / 60;
  return roadKm / ROAD_FACTOR;
}
