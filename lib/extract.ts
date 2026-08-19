/**
 * Ingestion pipeline. Takes raw LLM output and turns it into validated,
 * taxonomy-mapped domain objects.
 *
 * This file is where we refuse to trust the model. Every claim must survive:
 *   1. schema validation      — right shape, right enum values
 *   2. span verification      — the evidence must appear VERBATIM in the source
 *   3. taxonomy normalization — the skill must resolve to a real ID
 *   4. deduplication          — one claim per skill, strongest tier wins
 *
 * A claim that fails any stage is DROPPED, not downgraded or guessed at.
 * See CLAUDE.md §5.
 */

import type {
  SkillClaim,
  EvidenceTier,
  CandidateExtractionResponse,
  JobExtractionResponse,
  VerificationQuestion,
  Job,
  Shift,
  EmployerType,
} from "./types";
import { normalizeSkillMention, getSkill } from "./normalize";
import { VERIFICATION_QUESTIONS, genericVerificationQuestion } from "./prompts";

const TIERS: EvidenceTier[] = ["stated", "demonstrated", "implied"];
const TIER_RANK: Record<EvidenceTier, number> = {
  stated: 3,
  demonstrated: 2,
  implied: 1,
};

const EMPLOYER_TYPES: EmployerType[] = [
  "kirana", "bakery", "medical_shop", "auto_workshop", "tuition_centre",
  "warehouse", "salon", "hotel", "school_office", "pharmacy", "other",
];

const ALLOWED_ELIGIBILITY = new Set([
  "two_wheeler_licence", "lmv_licence", "food_handler_certificate",
  "first_aid_certificate", "pharmacy_assistant_certificate",
]);

export class ExtractionError extends Error {}

/**
 * Strip markdown fences and parse. Models wrap JSON in ```json despite being
 * told not to; that is not worth a retry.
 */
export function parseModelJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1)) as T;
    }
    throw new ExtractionError("Model did not return parseable JSON");
  }
}

// ── candidate side ────────────────────────────────────────────────────

export interface CandidateIngestResult {
  claims: SkillClaim[];
  /** Mentions the model produced that we could not map. Feeds the eval. */
  unmatchedMentions: string[];
  /** Claims dropped because the evidence span was not verbatim. */
  droppedForBadSpan: string[];
}

/**
 * Locate the span in the source text. Tries exact, then case-insensitive,
 * then whitespace-normalized. Returns null if genuinely absent — that means
 * the model paraphrased or invented, and the claim is discarded.
 */
function locateSpan(
  story: string,
  span: string
): { text: string; start: number; end: number } | null {
  if (!span) return null;

  let idx = story.indexOf(span);
  if (idx !== -1) return { text: span, start: idx, end: idx + span.length };

  idx = story.toLowerCase().indexOf(span.toLowerCase());
  if (idx !== -1) {
    return { text: story.slice(idx, idx + span.length), start: idx, end: idx + span.length };
  }

  // Whitespace-tolerant search — build a regex from the span's words.
  const words = span.trim().split(/\s+/).map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  if (words.length === 0) return null;
  const re = new RegExp(words.join("\\s+"), "i");
  const m = re.exec(story);
  if (m && m.index !== undefined) {
    return { text: m[0], start: m.index, end: m.index + m[0].length };
  }

  return null;
}

export function ingestCandidateExtraction(
  raw: CandidateExtractionResponse,
  story: string
): CandidateIngestResult {
  if (!raw || !Array.isArray(raw.extractions)) {
    throw new ExtractionError("Missing extractions array");
  }

  const bySkill = new Map<string, SkillClaim>();
  const unmatched: string[] = [];
  const droppedForBadSpan: string[] = [];

  for (const e of raw.extractions) {
    if (!e || typeof e.rawSkillText !== "string") continue;
    if (!TIERS.includes(e.tier)) continue;

    const located = locateSpan(story, e.evidenceSpan ?? "");
    if (!located) {
      droppedForBadSpan.push(e.rawSkillText);
      continue;
    }

    const norm = normalizeSkillMention(e.rawSkillText);
    if (!norm.skillId) {
      unmatched.push(e.rawSkillText);
      continue;
    }

    const claim: SkillClaim = {
      skillId: norm.skillId,
      tier: e.tier,
      evidenceSpan: located.text,
      spanStart: located.start,
      spanEnd: located.end,
      userConfirmed: false,
    };

    // Same skill claimed twice: keep the strongest tier.
    const existing = bySkill.get(norm.skillId);
    if (!existing || TIER_RANK[claim.tier] > TIER_RANK[existing.tier]) {
      bySkill.set(norm.skillId, claim);
    }
  }

  const claims = [...bySkill.values()].sort(
    (a, b) =>
      TIER_RANK[b.tier] - TIER_RANK[a.tier] || a.skillId.localeCompare(b.skillId)
  );

  return { claims, unmatchedMentions: unmatched, droppedForBadSpan };
}

/**
 * The set of skills a candidate actually holds, for matching purposes.
 *
 * POLICY: `implied` claims count only once the user has confirmed them.
 * `stated` and `demonstrated` count immediately. This is deliberate — we
 * never assert an inferred skill to an employer on the model's say-so alone.
 * See CLAUDE.md §5 and the ethics answer in the pitch.
 */
export function heldSkillIds(claims: SkillClaim[]): Set<string> {
  return new Set(
    claims
      .filter((c) => c.tier !== "implied" || c.userConfirmed)
      .map((c) => c.skillId)
  );
}

/** One question per unconfirmed implied claim. No LLM call. */
export function buildVerificationQuestions(
  claims: SkillClaim[]
): VerificationQuestion[] {
  return claims
    .filter((c) => c.tier === "implied" && !c.userConfirmed)
    .map((c, i) => ({
      id: `VQ_${i + 1}`,
      skillId: c.skillId,
      question:
        VERIFICATION_QUESTIONS[c.skillId] ??
        genericVerificationQuestion(getSkill(c.skillId).canonicalName),
      tierIfYes: "demonstrated" as EvidenceTier,
    }));
}

/** Apply a yes answer: promote the tier and mark confirmed. */
export function applyVerificationAnswer(
  claims: SkillClaim[],
  skillId: string,
  answeredYes: boolean
): SkillClaim[] {
  return claims.map((c) => {
    if (c.skillId !== skillId) return c;
    if (!answeredYes) return c;
    return { ...c, tier: "demonstrated" as EvidenceTier, userConfirmed: true };
  });
}

// ── employer side ─────────────────────────────────────────────────────

function clampShift(s: Shift | null): Shift | null {
  if (!s) return null;
  if (typeof s.startMin !== "number" || typeof s.endMin !== "number") return null;
  if (s.endMin <= s.startMin) return null;
  const days = Array.isArray(s.days)
    ? s.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  if (days.length === 0) return null;
  return { startMin: s.startMin, endMin: s.endMin, days: [...new Set(days)].sort() };
}

export interface JobIngestResult {
  job: Job;
  unmatchedMentions: string[];
  /** Fields the employer did not specify, so the UI can prompt for them. */
  missingFields: string[];
}

/** Defaults applied ONLY when the employer said nothing. Surfaced in the UI. */
const DEFAULT_SHIFT: Shift = { startMin: 540, endMin: 1080, days: [1, 2, 3, 4, 5, 6] };

export function ingestJobExtraction(
  raw: JobExtractionResponse,
  opts: {
    id: string;
    employerName: string;
    location: { lat: number; lng: number };
    areaName: string;
    rawDescription: string;
  }
): JobIngestResult {
  if (!raw || typeof raw.title !== "string") {
    throw new ExtractionError("Missing title");
  }

  const unmatched: string[] = [];
  const missing: string[] = [];

  const mapList = (list: unknown): string[] => {
    if (!Array.isArray(list)) return [];
    const out: string[] = [];
    for (const item of list) {
      if (typeof item !== "string") continue;
      const n = normalizeSkillMention(item);
      if (n.skillId) out.push(n.skillId);
      else unmatched.push(item);
    }
    return [...new Set(out)];
  };

  const required = mapList(raw.rawRequiredSkills);
  const preferred = mapList(raw.rawPreferredSkills).filter(
    (s) => !required.includes(s)
  );

  const shift = clampShift(raw.shift);
  if (!shift) missing.push("shift");

  let salaryMin = typeof raw.salaryMin === "number" ? raw.salaryMin : null;
  let salaryMax = typeof raw.salaryMax === "number" ? raw.salaryMax : null;
  if (salaryMin === null || salaryMax === null) missing.push("salary");
  if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) {
    [salaryMin, salaryMax] = [salaryMax, salaryMin];
  }

  const finalShift = shift ?? DEFAULT_SHIFT;
  const spanHours =
    ((finalShift.endMin - finalShift.startMin) / 60) * finalShift.days.length;
  const hours =
    typeof raw.hoursPerWeek === "number" && raw.hoursPerWeek > 0
      ? raw.hoursPerWeek
      : Math.round(spanHours);
  if (typeof raw.hoursPerWeek !== "number") missing.push("hoursPerWeek");

  const employerType = EMPLOYER_TYPES.includes(raw.employerType)
    ? raw.employerType
    : "other";

  const eligibility = Array.isArray(raw.hardEligibility)
    ? raw.hardEligibility.filter((e) => ALLOWED_ELIGIBILITY.has(e))
    : [];

  const job: Job = {
    id: opts.id,
    title: raw.title.trim(),
    employerName: opts.employerName,
    employerType,
    location: opts.location,
    areaName: opts.areaName,
    requiredSkills: required,
    preferredSkills: preferred,
    // If salary is unstated we cannot gate on it; a wide band means the
    // feasibility check will not wrongly exclude anyone. The UI must show
    // this as unspecified rather than as a real offer.
    salaryMin: salaryMin ?? 0,
    salaryMax: salaryMax ?? 999999,
    shift: finalShift,
    hoursPerWeek: hours,
    hardEligibility: eligibility,
    minExperienceMonths:
      typeof raw.minExperienceMonths === "number" && raw.minExperienceMonths > 0
        ? raw.minExperienceMonths
        : 0,
    rawDescription: opts.rawDescription,
    isSynthetic: false,
  };

  return { job, unmatchedMentions: unmatched, missingFields: missing };
}
