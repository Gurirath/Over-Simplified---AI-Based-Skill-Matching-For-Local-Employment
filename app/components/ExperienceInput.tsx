"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, CheckCircle2, X, Plus, ArrowRight, Edit3, Lightbulb, Check, HelpCircle } from "lucide-react";
import type { Candidate, SkillClaim } from "@/lib/types";
import { getSkill, normalizeSkillMention } from "@/lib/normalize";
import { buildVerificationQuestions, applyVerificationAnswer, type CandidateIngestResult } from "@/lib/extract";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, LOCALIZED_PROMPT_EXAMPLES, type LanguageCode } from "./i18n";
import { EVIDENCE_TIER_LABELS, EVIDENCE_TIER_DESCRIPTIONS, heldSkillIds } from "./adapters";

interface ExperienceInputProps {
  candidate: Candidate;
  onUpdateCandidate: (updated: Candidate) => void;
  feasibleJobsCount: number;
  qualifiedJobsCount: number;
  language?: LanguageCode;
}

type ProcessingStep = "idle" | "sending" | "complete" | "error";

/** Renders rawStory with each claim's evidence span highlighted (CLAUDE.md §5). */
function HighlightedStory({ story, claims }: { story: string; claims: SkillClaim[] }) {
  const sorted = [...claims].sort((a, b) => a.spanStart - b.spanStart);
  const segments: { text: string; skillId: string | null }[] = [];
  let cursor = 0;

  for (const claim of sorted) {
    if (claim.spanStart < cursor) continue; // skip overlapping spans
    if (claim.spanStart > cursor) segments.push({ text: story.slice(cursor, claim.spanStart), skillId: null });
    segments.push({ text: story.slice(claim.spanStart, claim.spanEnd), skillId: claim.skillId });
    cursor = claim.spanEnd;
  }
  if (cursor < story.length) segments.push({ text: story.slice(cursor), skillId: null });

  return (
    <p className="text-xs sm:text-sm leading-relaxed text-neutral-800">
      {segments.map((seg, i) =>
        seg.skillId ? (
          <mark key={i} className="bg-transparent border-b-2 px-0" style={{ borderColor: "var(--accent-border)", backgroundColor: "var(--accent-light)" }} title={getSkill(seg.skillId).canonicalName}>
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </p>
  );
}

export const ExperienceInput: React.FC<ExperienceInputProps> = ({
  candidate,
  onUpdateCandidate,
  feasibleJobsCount,
  qualifiedJobsCount,
  language = "en",
}) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const promptExamples = LOCALIZED_PROMPT_EXAMPLES;

  const initialText = candidate.rawStory || promptExamples[0]?.text[language] || promptExamples[0]?.text.en || "";

  const [storyText, setStoryText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(candidate.skillClaims.length === 0);
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  const isLoading = step === "sending";
  const held = heldSkillIds(candidate);
  const verificationQuestions = useMemo(() => buildVerificationQuestions(candidate.skillClaims), [candidate.skillClaims]);

  const handleAnalyzeExperience = async () => {
    if (!storyText.trim()) return;
    setStep("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/extract-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: storyText }),
      });
      const data = (await res.json()) as CandidateIngestResult & { fromCache?: boolean; error?: string };

      if (!res.ok || !Array.isArray(data.claims)) {
        throw new Error(data.error || "Extraction failed");
      }

      onUpdateCandidate({ ...candidate, rawStory: storyText, skillClaims: data.claims });
      setUnmatched(data.unmatchedMentions ?? []);
      setStep("complete");
      setIsEditing(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong extracting skills.");
      setStep("error");
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    onUpdateCandidate({ ...candidate, skillClaims: candidate.skillClaims.filter((c) => c.skillId !== skillId) });
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizeSkillMention(newSkillInput);
    if (!norm.skillId) return; // unmatched — don't fabricate a claim for an unknown skill
    if (candidate.skillClaims.some((c) => c.skillId === norm.skillId)) {
      setNewSkillInput("");
      setIsAddingSkill(false);
      return;
    }

    const skillLabel = getSkill(norm.skillId).canonicalName;
    const clauseCore = `I also do ${skillLabel}`;
    const separator = candidate.rawStory && !candidate.rawStory.endsWith(" ") ? " " : "";
    const newStory = `${candidate.rawStory}${separator}${clauseCore}.`;
    const spanStart = newStory.lastIndexOf(clauseCore);

    const newClaim: SkillClaim = {
      skillId: norm.skillId,
      tier: "stated",
      evidenceSpan: clauseCore,
      spanStart,
      spanEnd: spanStart + clauseCore.length,
      userConfirmed: true,
    };

    onUpdateCandidate({ ...candidate, rawStory: newStory, skillClaims: [...candidate.skillClaims, newClaim] });
    setStoryText(newStory);
    setNewSkillInput("");
    setIsAddingSkill(false);
  };

  const handleVerificationAnswer = (skillId: string, answeredYes: boolean) => {
    onUpdateCandidate({ ...candidate, skillClaims: applyVerificationAnswer(candidate.skillClaims, skillId, answeredYes) });
  };

  const hasAttempted = candidate.skillClaims.length > 0 || step === "complete" || step === "error";

  return (
    <section aria-labelledby="experience-section-heading" className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-100">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentHex }} />
            <h2 id="experience-section-heading" className="text-base font-bold text-neutral-950 tracking-tight">
              {t.experienceHeading}
            </h2>
            <span
              className="px-2 py-0.5 text-[10px] font-mono font-medium rounded border"
              style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
            >
              {t.experienceBadge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{t.experienceDesc}</p>
          <p className="text-[11px] text-neutral-500 font-mono">{t.experienceSubDesc}</p>
        </div>

        {!isEditing && hasAttempted && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-md border border-neutral-200 transition-colors cursor-pointer self-start shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
            <span>{t.editExperience}</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="experience-textarea" className="sr-only">
              {t.experiencePlaceholder}
            </label>
            <textarea
              id="experience-textarea"
              rows={4}
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder={t.experiencePlaceholder}
              className="w-full p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed bg-neutral-50/60 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all resize-y min-h-[110px]"
            />
            {storyText && (
              <button
                type="button"
                onClick={() => setStoryText("")}
                className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 text-xs p-1 rounded hover:bg-neutral-200/50"
                title="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.clickExampleToLoad}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {promptExamples.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setStoryText(ex.text[language] || ex.text.en)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100/80 hover:bg-neutral-200 text-neutral-700 rounded-md border border-neutral-200/90 transition-colors cursor-pointer text-left"
                >
                  {ex.tag[language] || ex.tag.en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isLoading || !storyText.trim()}
                onClick={handleAnalyzeExperience}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer ${
                  isLoading || !storyText.trim() ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "text-white active:scale-[0.99]"
                }`}
                style={{ backgroundColor: isLoading || !storyText.trim() ? undefined : accentHex }}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Extracting skills…</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.identifyMySkills}</span>
                  </>
                )}
              </button>

              {hasAttempted && !isLoading && (
                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-2 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer">
                  {t.cancel}
                </button>
              )}
            </div>

            <div className="text-[11px] font-mono text-neutral-400">{t.deterministicModel}</div>
          </div>

          {step === "error" && errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">{errorMessage}</div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 sm:p-4 bg-neutral-50/70 rounded-lg border border-neutral-200 relative">
            <span className="font-mono text-[10px] text-neutral-500 uppercase not-italic block mb-1.5">Your experience, evidence highlighted</span>
            <HighlightedStory story={candidate.rawStory} claims={candidate.skillClaims} />
          </div>
        </div>
      )}

      {hasAttempted && !isLoading && (
        <div className="pt-3 space-y-5">
          {candidate.skillClaims.length > 0 ? (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-neutral-950 tracking-tight">{t.foundSkillsTitle}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                    {candidate.skillClaims.length} {t.identifiedCount}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">{t.identifiedFromExperience}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {candidate.skillClaims.map((claim) => {
                  const isCounted = held.has(claim.skillId);
                  return (
                    <span
                      key={claim.skillId}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-mono font-medium border shadow-2xs group"
                      style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
                    >
                      {isCounted ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: accentHex }} /> : <HelpCircle className="w-3.5 h-3.5 shrink-0 text-neutral-400" />}
                      <span>{getSkill(claim.skillId).canonicalName}</span>
                      <span
                        className="text-[9px] font-semibold px-1 rounded bg-white/70 border border-black/5"
                        title={EVIDENCE_TIER_DESCRIPTIONS[claim.tier]}
                      >
                        {EVIDENCE_TIER_LABELS[claim.tier]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(claim.skillId)}
                        className="ml-1 p-0.5 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Remove ${getSkill(claim.skillId).canonicalName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {isAddingSkill ? (
                  <form onSubmit={handleAddCustomSkill} className="inline-flex items-center gap-1 bg-white border border-neutral-300 rounded-lg px-2 py-0.5 shadow-2xs">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Tally, GST filing"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="text-xs font-mono text-neutral-800 outline-none w-36 bg-transparent"
                    />
                    <button type="submit" className="text-[11px] font-mono text-white px-2 py-0.5 rounded cursor-pointer" style={{ backgroundColor: accentHex }}>
                      {t.addSkillBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSkill(false);
                        setNewSkillInput("");
                      }}
                      className="text-neutral-400 hover:text-neutral-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingSkill(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-neutral-600 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.addAnotherSkill}</span>
                  </button>
                )}
              </div>

              {unmatched.length > 0 && (
                <p className="text-[11px] text-neutral-400 font-mono">
                  Not matched to our skill taxonomy: {unmatched.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <Lightbulb className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{t.lowSignalTitle}</span>
              </div>
              <p className="text-amber-800/80 leading-relaxed">{t.lowSignalDesc}</p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-md border border-amber-300 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t.editExperienceDesc}</span>
              </button>
            </div>
          )}

          {verificationQuestions.length > 0 && (
            <div className="p-4 bg-neutral-50/80 rounded-lg border border-neutral-200 space-y-3">
              <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" style={{ color: accentHex }} />
                Quick check — confirm what we inferred
              </div>
              {verificationQuestions.map((q) => (
                <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-md border border-neutral-200">
                  <span className="text-neutral-700">{q.question}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleVerificationAnswer(q.skillId, true)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md text-white cursor-pointer"
                      style={{ backgroundColor: accentHex }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerificationAnswer(q.skillId, false)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-neutral-100">
            <div className="bg-neutral-50/80 rounded-lg p-3.5 border border-neutral-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center text-[10px] font-mono font-bold">1</div>
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase block">{t.step1Title}</span>
                    <span className="font-medium text-neutral-800">{t.step1Desc}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md text-white flex items-center justify-center text-[10px] font-mono font-bold" style={{ backgroundColor: accentHex }}>2</div>
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase block">{t.step2Title}</span>
                    <span className="font-semibold font-mono" style={{ color: "var(--accent-fg)" }}>
                      {candidate.skillClaims.length} {t.step2Desc}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">3</div>
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase block">{t.step3Title}</span>
                    <span className="font-semibold text-emerald-900 font-mono">
                      {feasibleJobsCount} within reach · {qualifiedJobsCount} qualified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
