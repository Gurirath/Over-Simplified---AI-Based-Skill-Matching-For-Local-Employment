/**
 * REACH — Core type contract.
 *
 * This file is the single source of truth for all data shapes in the project.
 * It contains NO logic. Only types.
 *
 * RULE: Do not change a type in here without telling the whole team.
 * Every workstream (logic / data / UI / LLM) codes against these shapes,
 * so a silent change here breaks three other people's work.
 */

// ─────────────────────────────────────────────────────────────
// 1. SKILL TAXONOMY  (static data — skills.json)
// ─────────────────────────────────────────────────────────────

export type SkillCategory =
  | "retail_sales"
  | "accounting_billing"
  | "digital_admin"
  | "trades"
  | "hospitality_food"
  | "logistics"
  | "care"
  | "machine_operation"
  | "communication_language";

export type LearnCostBand = "free" | "low" | "medium" | "high";

/** One canonical skill in the taxonomy. ~120 of these live in skills.json. */
export interface Skill {
  /** Stable ID. Format: SKILL_UPPER_SNAKE. e.g. "SKILL_TALLY_BASIC" */
  id: string;
  /** Human-facing name. e.g. "Tally (Basic)" */
  canonicalName: string;
  /**
   * Every surface form that should normalize to this skill.
   * Include Hindi/Hinglish forms. e.g. ["tally", "tally erp", "tally chalana"]
   * Lowercased, no punctuation.
   */
  aliases: string[];
  category: SkillCategory;
  /** Skill IDs that should realistically be learned first. May be empty. */
  prerequisites: string[];
  /** Estimated hours to reach working competence. Used by the optimizer. */
  learnHours: number;
  learnCostBand: LearnCostBand;
  /** How someone could prove it. Shown in UI, not used in scoring. */
  verifiableBy: string;
}

// ─────────────────────────────────────────────────────────────
// 2. CANDIDATE
// ─────────────────────────────────────────────────────────────

/**
 * Evidence tier for a skill claim.
 *
 * stated       — user named the skill directly ("I make Excel sheets")
 * demonstrated — user described the activity, not the skill
 *                ("I maintain the stock register" -> inventory management)
 * implied      — inferred from role context
 *                ("worked in my father's shop 3 years" -> retail operations)
 *
 * HARD RULE: there is no numeric confidence score anywhere in this system.
 * Tiers only. See CLAUDE.md.
 */
export type EvidenceTier = "stated" | "demonstrated" | "implied";

export interface SkillClaim {
  skillId: string;
  tier: EvidenceTier;
  /**
   * The EXACT substring of the user's own input this claim came from.
   * Must appear verbatim in Candidate.rawStory so the UI can highlight it.
   */
  evidenceSpan: string;
  /** Character offsets into rawStory. Used for highlighting. */
  spanStart: number;
  spanEnd: number;
  /** True once the user has answered a micro-verification question yes. */
  userConfirmed: boolean;
}

export type TransportMode = "walk" | "cycle" | "bus" | "two_wheeler";

export interface Availability {
  /** 24h clock, minutes from midnight. e.g. 13:00 -> 780 */
  earliestStartMin: number;
  latestEndMin: number;
  /** Minimum hours/week the candidate needs to earn enough. */
  minHoursPerWeek: number;
  /** Maximum hours/week they can physically give. */
  maxHoursPerWeek: number;
  /** 0 = Sunday ... 6 = Saturday */
  availableDays: number[];
}

export interface CandidateConstraints {
  /** Hard floor. A job paying below this is INFEASIBLE, not low-scoring. */
  minMonthlySalary: number;
  /** Hard ceiling on one-way door-to-door commute, in minutes. */
  maxCommuteMinutes: number;
  availableModes: TransportMode[];
  availability: Availability;
  /** e.g. ["driving_licence_lmv"]. Matched against Job.hardEligibility. */
  credentials: string[];
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Candidate {
  id: string;
  displayName: string;
  /** Optional — used for demo personas only. */
  age?: number;
  location: GeoPoint;
  /** The raw natural-language story. Evidence spans index into this. */
  rawStory: string;
  skillClaims: SkillClaim[];
  constraints: CandidateConstraints;
}

/**
 * A question generated to promote an `implied` claim to `demonstrated`.
 * Answering yes sets userConfirmed and may upgrade the tier.
 */
export interface VerificationQuestion {
  id: string;
  skillId: string;
  /** e.g. "You mentioned the stock register. Did you also decide what to reorder?" */
  question: string;
  /** Tier this claim becomes if the answer is yes. */
  tierIfYes: EvidenceTier;
}

// ─────────────────────────────────────────────────────────────
// 3. JOB
// ─────────────────────────────────────────────────────────────

export type EmployerType =
  | "kirana"
  | "bakery"
  | "medical_shop"
  | "auto_workshop"
  | "tuition_centre"
  | "warehouse"
  | "salon"
  | "hotel"
  | "school_office"
  | "pharmacy"
  | "other";

export interface Shift {
  startMin: number;
  endMin: number;
  /** 0 = Sunday ... 6 = Saturday */
  days: number[];
}

export interface Job {
  id: string;
  title: string;
  employerName: string;
  employerType: EmployerType;
  location: GeoPoint;
  /** Free-text area name for display. e.g. "Katpadi" */
  areaName: string;

  /** Skill IDs that MUST be held. Drives missing() and the optimizer. */
  requiredSkills: string[];
  /** Skill IDs that improve the score but never gate feasibility. */
  preferredSkills: string[];

  salaryMin: number;
  salaryMax: number;
  shift: Shift;
  hoursPerWeek: number;

  /** Hard gates. e.g. ["driving_licence_lmv"]. Empty for most local roles. */
  hardEligibility: string[];
  minExperienceMonths: number;

  /** The original plain-language text, if created via employer intake. */
  rawDescription?: string;
  /** true = generated corpus, false = created live during demo. */
  isSynthetic: boolean;
}

// ─────────────────────────────────────────────────────────────
// 4. MATCHING — STAGE 1: FEASIBILITY (boolean gate)
// ─────────────────────────────────────────────────────────────

/**
 * Why a job was ruled out. A job is infeasible if ANY reason fires.
 * Feasibility is NEVER blended into the score. See CLAUDE.md §3.
 */
export type InfeasibilityReason =
  | "salary_below_floor"
  | "commute_too_long"
  | "schedule_conflict"
  | "insufficient_hours"
  | "no_transport_route"
  | "missing_hard_eligibility";

export interface CommuteEstimate {
  mode: TransportMode;
  straightLineKm: number;
  /** straightLineKm * ROAD_FACTOR */
  roadKm: number;
  /** Includes the fixed first/last-mile penalty. */
  minutes: number;
}

export interface FeasibilityResult {
  jobId: string;
  feasible: boolean;
  /** Empty iff feasible. */
  reasons: InfeasibilityReason[];
  /** Best available mode within the candidate's constraints. */
  bestCommute: CommuteEstimate | null;
}

// ─────────────────────────────────────────────────────────────
// 5. MATCHING — STAGE 2: SCORING (feasible jobs only)
// ─────────────────────────────────────────────────────────────

/** Weights are shown on screen and adjustable by a judge via sliders. */
export interface ScoreWeights {
  skillCoverage: number;
  experienceRelevance: number;
  commuteMargin: number;
  salaryHeadroom: number;
  scheduleComfort: number;
}

export interface ScoreComponent {
  key: keyof ScoreWeights;
  /** Normalized 0..1 before weighting. */
  raw: number;
  weight: number;
  /** raw * weight */
  weighted: number;
  /** Plain-language line for the explanation panel. */
  explanation: string;
}

export interface MatchResult {
  jobId: string;
  candidateId: string;
  /** Sum of weighted components, 0..1. Only defined for feasible jobs. */
  score: number;
  components: ScoreComponent[];
  /** requiredSkills minus the candidate's held skills. */
  missingRequired: string[];
  /** True iff missingRequired is empty — candidate qualifies TODAY. */
  qualifiedNow: boolean;
  commute: CommuteEstimate;
}

// ─────────────────────────────────────────────────────────────
// 6. OPPORTUNITY ENGINE
// ─────────────────────────────────────────────────────────────

/**
 * Snapshot of a candidate's opportunity landscape for a given skill set.
 * `f(T)` in the write-up = qualifiedCount for skillSet ∪ T.
 */
export interface OpportunitySnapshot {
  /** All jobs that passed the feasibility gate. The denominator. */
  feasibleCount: number;
  /** Feasible jobs with no missing required skills. */
  qualifiedCount: number;
  qualifiedJobIds: string[];
  medianSalary: number | null;
}

/**
 * A recommended bundle of skills to learn.
 * NOTE: bundles may contain >1 skill because f is NOT submodular —
 * a job needing both Tally AND GST has zero gain from either alone.
 * This is why we enumerate exactly instead of running greedy. See CLAUDE.md §4.
 */
export interface SkillBundleRecommendation {
  skillIds: string[];
  /** qualifiedCount(S ∪ T) - qualifiedCount(S) */
  jobsUnlocked: number;
  newlyUnlockedJobIds: string[];
  totalLearnHours: number;
  /** jobsUnlocked / totalLearnHours * 10 — the headline metric. */
  jobsPer10Hours: number;
  medianSalaryBefore: number | null;
  medianSalaryAfter: number | null;
}

/** A feasible job where exactly one required skill is missing. */
export interface NearMissJob {
  jobId: string;
  missingSkillId: string;
}

// ─────────────────────────────────────────────────────────────
// 7. LLM INGESTION CONTRACTS
// ─────────────────────────────────────────────────────────────

/** Raw output of the candidate-story extraction call, pre-normalization. */
export interface RawSkillExtraction {
  /** Free-text skill mention as the model saw it. Normalized to a skillId later. */
  rawSkillText: string;
  tier: EvidenceTier;
  evidenceSpan: string;
}

export interface CandidateExtractionResponse {
  extractions: RawSkillExtraction[];
}

/** Raw output of the employer-description extraction call. */
export interface JobExtractionResponse {
  title: string;
  employerType: EmployerType;
  rawRequiredSkills: string[];
  rawPreferredSkills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  shift: Shift | null;
  hoursPerWeek: number | null;
  minExperienceMonths: number;
  hardEligibility: string[];
}

// ─────────────────────────────────────────────────────────────
// 8. EVAL HARNESS
// ─────────────────────────────────────────────────────────────

export interface EvalCase {
  id: string;
  story: string;
  /** Hand-labelled ground truth skill IDs. */
  expectedSkillIds: string[];
}

export interface EvalReport {
  /** Label for the run, e.g. "with normalization" / "no normalization". */
  variant: string;
  precision: number;
  recall: number;
  f1: number;
  casesRun: number;
}
