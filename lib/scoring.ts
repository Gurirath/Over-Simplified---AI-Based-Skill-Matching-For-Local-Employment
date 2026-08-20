/**
 * REACH — Stage 2 scoring.
 *
 * Runs ONLY on jobs that already passed the Stage 1 feasibility gate
 * (lib/feasibility.ts). See CLAUDE.md §3: feasibility is a boolean gate,
 * scoring only ranks the survivors, and the two must never be blended.
 *
 * In particular: candidate.constraints.minMonthlySalary and
 * candidate.constraints.maxCommuteMinutes are feasibility-only fields.
 * Nothing in this file reads them — see scoring.test.ts for an assertion
 * of that.
 */

import type {
  Candidate,
  CommuteEstimate,
  EvidenceTier,
  FeasibilityResult,
  Job,
  MatchResult,
  ScoreComponent,
  ScoreWeights,
} from "./types";
import { missingSkills } from "./optimizer";

/** Shown on screen and adjustable via UI sliders. Must sum to a positive number. */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  skillCoverage: 0.35,
  experienceRelevance: 0.15,
  commuteMargin: 0.2,
  salaryHeadroom: 0.15,
  scheduleComfort: 0.15,
};

const TIER_STRENGTH: Record<EvidenceTier, number> = {
  stated: 1,
  demonstrated: 0.75,
  implied: 0.5,
};

/**
 * Absolute local-market reference band (CLAUDE.md §6: "roughly Rs 9,000-22,000/month
 * for the local informal sector"). Deliberately NOT candidate.constraints.minMonthlySalary
 * — that is a hard feasibility floor and must never feed the score (CLAUDE.md §3).
 */
const SALARY_REFERENCE_MIN = 9000;
const SALARY_REFERENCE_MAX = 22000;

/**
 * Absolute reference ceiling for "a long commute". Deliberately NOT
 * candidate.constraints.maxCommuteMinutes — that is a hard feasibility ceiling
 * and must never feed the score (CLAUDE.md §3). This measures absolute travel
 * burden, not slack against any one candidate's personal limit.
 */
const COMMUTE_REFERENCE_MINUTES = 60;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function heldSkillIds(candidate: Candidate): Set<string> {
  return new Set(candidate.skillClaims.map((c) => c.skillId));
}

function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

function skillCoverageComponent(job: Job, held: Set<string>, weight: number): ScoreComponent {
  const combined = Array.from(new Set([...job.requiredSkills, ...job.preferredSkills]));
  const heldCount = combined.filter((id) => held.has(id)).length;
  const raw = combined.length === 0 ? 1 : heldCount / combined.length;
  const explanation =
    combined.length === 0
      ? "This role lists no specific required or preferred skills."
      : `You hold ${heldCount} of ${combined.length} required/preferred skills for this role.`;
  return { key: "skillCoverage", raw, weight, weighted: raw * weight, explanation };
}

function experienceRelevanceComponent(
  candidate: Candidate,
  job: Job,
  weight: number
): ScoreComponent {
  const relevantSkillIds = new Set([...job.requiredSkills, ...job.preferredSkills]);
  const bestStrengthBySkill = new Map<string, number>();
  for (const claim of candidate.skillClaims) {
    if (!relevantSkillIds.has(claim.skillId)) continue;
    const strength = TIER_STRENGTH[claim.tier];
    const existing = bestStrengthBySkill.get(claim.skillId) ?? 0;
    if (strength > existing) bestStrengthBySkill.set(claim.skillId, strength);
  }
  const matched = Array.from(bestStrengthBySkill.values());
  const raw = matched.length === 0 ? 0 : matched.reduce((a, b) => a + b, 0) / matched.length;
  const statedCount = matched.filter((s) => s === TIER_STRENGTH.stated).length;
  const explanation =
    matched.length === 0
      ? "None of your matched skills have supporting evidence from your story yet."
      : `${statedCount} of ${matched.length} matched skills are directly self-stated; the rest are inferred from what you described.`;
  return { key: "experienceRelevance", raw, weight, weighted: raw * weight, explanation };
}

function commuteMarginComponent(commute: CommuteEstimate, weight: number): ScoreComponent {
  const raw = clamp01(1 - commute.minutes / COMMUTE_REFERENCE_MINUTES);
  const modeLabel = commute.mode.replace("_", " ");
  const explanation = `About ${Math.round(commute.minutes)} minutes by ${modeLabel} — shorter commutes score higher.`;
  return { key: "commuteMargin", raw, weight, weighted: raw * weight, explanation };
}

function salaryHeadroomComponent(job: Job, weight: number): ScoreComponent {
  const span = SALARY_REFERENCE_MAX - SALARY_REFERENCE_MIN;
  const raw = clamp01((job.salaryMax - SALARY_REFERENCE_MIN) / span);
  const position = raw >= 0.5 ? "above" : "below";
  const explanation = `Pays up to Rs${job.salaryMax.toLocaleString("en-IN")}/month, ${position} the middle of the local market range.`;
  return { key: "salaryHeadroom", raw, weight, weighted: raw * weight, explanation };
}

function scheduleComfortComponent(candidate: Candidate, job: Job, weight: number): ScoreComponent {
  const avail = candidate.constraints.availability;
  const shift = job.shift;
  const shiftDuration = shift.endMin - shift.startMin;
  const durationCoverage =
    shiftDuration <= 0
      ? 1
      : clamp01(
          overlapMinutes(avail.earliestStartMin, avail.latestEndMin, shift.startMin, shift.endMin) /
            shiftDuration
        );
  const overlapDays = shift.days.filter((d) => avail.availableDays.includes(d)).length;
  const daysCoverage = shift.days.length === 0 ? 1 : clamp01(overlapDays / shift.days.length);
  const raw = clamp01((durationCoverage + daysCoverage) / 2);
  const explanation = `Your available hours cover ${Math.round(durationCoverage * 100)}% of the shift and ${Math.round(daysCoverage * 100)}% of its rostered days.`;
  return { key: "scheduleComfort", raw, weight, weighted: raw * weight, explanation };
}

/**
 * Scores one feasible job for one candidate. Throws if `feasibility` says the
 * job did not pass Stage 1 — this function must never be called on an
 * infeasible job (CLAUDE.md §3).
 */
export function scoreJob(
  candidate: Candidate,
  job: Job,
  feasibility: FeasibilityResult,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): MatchResult {
  if (feasibility.jobId !== job.id) {
    throw new Error(`Feasibility result is for job ${feasibility.jobId}, not ${job.id}.`);
  }
  if (!feasibility.feasible || !feasibility.bestCommute) {
    throw new Error(
      `scoreJob only runs on jobs that already passed the feasibility gate (job ${job.id} did not).`
    );
  }

  const totalWeight =
    weights.skillCoverage +
    weights.experienceRelevance +
    weights.commuteMargin +
    weights.salaryHeadroom +
    weights.scheduleComfort;
  if (totalWeight <= 0) {
    throw new Error("Score weights must sum to a positive number.");
  }
  const normalize = (w: number) => w / totalWeight;

  const held = heldSkillIds(candidate);

  const components: ScoreComponent[] = [
    skillCoverageComponent(job, held, normalize(weights.skillCoverage)),
    experienceRelevanceComponent(candidate, job, normalize(weights.experienceRelevance)),
    commuteMarginComponent(feasibility.bestCommute, normalize(weights.commuteMargin)),
    salaryHeadroomComponent(job, normalize(weights.salaryHeadroom)),
    scheduleComfortComponent(candidate, job, normalize(weights.scheduleComfort)),
  ];

  const score = components.reduce((sum, c) => sum + c.weighted, 0);
  const missingRequired = missingSkills(job, held);

  return {
    jobId: job.id,
    candidateId: candidate.id,
    score,
    components,
    missingRequired,
    qualifiedNow: missingRequired.length === 0,
    commute: feasibility.bestCommute,
  };
}
