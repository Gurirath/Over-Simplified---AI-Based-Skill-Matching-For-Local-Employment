/**
 * View-model types for the merged UI. These are NOT part of the lib/types.ts
 * contract — they're display-shaping types local to app/components/, built
 * on top of the real contract types, never a replacement for them.
 */

import type { FeasibilityResult, Job } from "@/lib/types";

export interface FunnelStage {
  stage: string;
  count: number;
  description: string;
}

export interface EvaluatedJobView {
  job: Job;
  feasibility: FeasibilityResult;
  missingRequired: string[];
  qualifiedNow: boolean;
  /** Human-readable sentences for feasibility.reasons, in the same order. */
  reasonSentences: string[];
}

export interface RequestedSkillItem {
  skillId: string;
  skillName: string;
  employerCount: number;
  jobCount: number;
}
