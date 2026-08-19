/**
 * Deterministic mapping from free-text skill mentions to taxonomy skill IDs.
 *
 * NO LLM. See CLAUDE.md §2. The model returns raw text; this file decides what
 * that text means. That separation is what makes extraction auditable — if a
 * skill maps wrongly, it is a fixable alias bug, not a model mystery.
 *
 * Matching is a strict cascade. Each stage is more permissive than the last,
 * and the first hit wins:
 *   1. exact alias match
 *   2. exact canonical-name match
 *   3. containment (alias fully contained in the input, or vice versa)
 *   4. token overlap above threshold
 * If nothing matches, the mention is returned as unmatched — never guessed.
 * Unmatched mentions are surfaced in the eval, which is how the alias list
 * gets better.
 */

import skillsData from "@/data/skills.json";
import type { Skill } from "./types";

const SKILLS = skillsData as Skill[];

/** Words that carry no discriminating signal in skill names. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "for", "in", "on", "at", "to", "with",
  "basic", "basics", "simple", "general", "work", "working", "job", "skill",
  "skills", "knowledge", "ka", "ki", "ke", "ko", "se", "mein", "hai", "hoon",
  "karna", "karta", "karti", "kar", "raha", "rahi", "bhi", "aur",
]);

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalizeText(s)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// ── indexes, built once at module load ────────────────────────────────

const aliasIndex = new Map<string, string>();
const canonicalIndex = new Map<string, string>();
const tokenIndex: Array<{ id: string; tokens: Set<string>; text: string }> = [];

for (const skill of SKILLS) {
  canonicalIndex.set(normalizeText(skill.canonicalName), skill.id);
  for (const alias of skill.aliases) {
    const key = normalizeText(alias);
    if (!key) continue;
    // Duplicate aliases are a data bug — gen_skills.py asserts against them.
    // If one slips through, first definition wins and we do not silently
    // overwrite, so behaviour stays deterministic.
    if (!aliasIndex.has(key)) aliasIndex.set(key, skill.id);
    tokenIndex.push({ id: skill.id, tokens: new Set(tokens(alias)), text: key });
  }
  tokenIndex.push({
    id: skill.id,
    tokens: new Set(tokens(skill.canonicalName)),
    text: normalizeText(skill.canonicalName),
  });
}

export type MatchStage =
  | "exact_alias"
  | "exact_canonical"
  | "containment"
  | "token_overlap"
  | "unmatched";

export interface NormalizationResult {
  input: string;
  skillId: string | null;
  stage: MatchStage;
  /** Only set for token_overlap, for debugging the eval. */
  overlapScore?: number;
}

const OVERLAP_THRESHOLD = 0.67;

/** Map one free-text skill mention to a taxonomy ID, or null. */
export function normalizeSkillMention(input: string): NormalizationResult {
  const key = normalizeText(input);
  if (!key) return { input, skillId: null, stage: "unmatched" };

  const alias = aliasIndex.get(key);
  if (alias) return { input, skillId: alias, stage: "exact_alias" };

  const canon = canonicalIndex.get(key);
  if (canon) return { input, skillId: canon, stage: "exact_canonical" };

  // Containment: prefer the LONGEST matching alias, so "advanced excel"
  // beats "excel" rather than losing to it on iteration order.
  let bestContain: { id: string; len: number } | null = null;
  for (const entry of tokenIndex) {
    if (entry.text.length < 4) continue;
    if (key.includes(entry.text) || entry.text.includes(key)) {
      if (!bestContain || entry.text.length > bestContain.len) {
        bestContain = { id: entry.id, len: entry.text.length };
      }
    }
  }
  if (bestContain) {
    return { input, skillId: bestContain.id, stage: "containment" };
  }

  const inputTokens = new Set(tokens(input));
  if (inputTokens.size === 0) return { input, skillId: null, stage: "unmatched" };

  let best: { id: string; score: number } | null = null;
  for (const entry of tokenIndex) {
    if (entry.tokens.size === 0) continue;
    let shared = 0;
    for (const t of inputTokens) if (entry.tokens.has(t)) shared++;
    if (shared === 0) continue;
    const score = shared / Math.max(inputTokens.size, entry.tokens.size);
    if (!best || score > best.score) best = { id: entry.id, score };
  }

  if (best && best.score >= OVERLAP_THRESHOLD) {
    return {
      input,
      skillId: best.id,
      stage: "token_overlap",
      overlapScore: best.score,
    };
  }

  return { input, skillId: null, stage: "unmatched" };
}

/** Look up a skill by ID. Throws on unknown IDs — a bad ID is a bug, not a miss. */
export function getSkill(id: string): Skill {
  const s = SKILLS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown skill id: ${id}`);
  return s;
}

export function allSkills(): Skill[] {
  return SKILLS;
}
