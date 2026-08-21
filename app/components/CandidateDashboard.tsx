"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, User, MapPin, Clock, Bus, CheckCircle2, HardDriveDownload } from "lucide-react";
import type { Candidate, CandidateConstraints, Employer, Job } from "@/lib/types";
import { getSkill, allSkills } from "@/lib/normalize";
import { filterFeasibleJobs } from "@/lib/feasibility";
import { computeNearMissBuckets, recommendSkillBundles } from "@/lib/optimizer";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import { LanguageSelector } from "./LanguageSelector";
import { CandidateProfileModal } from "./CandidateProfileModal";
import { OpportunitySummary } from "./OpportunitySummary";
import { OpportunityFunnel } from "./OpportunityFunnel";
import { SkillBundlesChart } from "./SkillBundlesChart";
import { RequestedSkillsChart } from "./RequestedSkillsChart";
import { NearMissChart } from "./NearMissChart";
import { OpportunitySimulator } from "./OpportunitySimulator";
import { OpportunityList } from "./OpportunityList";
import { ExperienceInput } from "./ExperienceInput";
import { buildFunnelStages, computeRequestedSkills, heldSkillIds, transportModeLabel, formatMinutesOfDay } from "./adapters";

const EmployerMap = dynamic(() => import("./EmployerMap").then((m) => m.EmployerMap), { ssr: false });

interface CandidateDashboardProps {
  candidate: Candidate;
  onUpdateCandidate?: (candidate: Candidate) => void;
  employers: Employer[];
  allJobs: Job[];
  onBackToOverview: () => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

const LEARN_HOURS_BY_SKILL_ID = new Map(allSkills().map((s) => [s.id, s.learnHours]));

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  candidate,
  onUpdateCandidate,
  employers,
  allJobs,
  onBackToOverview,
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];

  // Lazy-initialized from the `candidate` prop. If the parent needs to swap
  // in a different candidate (e.g. a different persona), it should remount
  // this component with a new `key` rather than relying on this state to
  // resync via an effect.
  const [currentCandidate, setCurrentCandidate] = useState<Candidate>(candidate);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [simulatedConstraints, setSimulatedConstraints] = useState<CandidateConstraints>(candidate.constraints);

  const handleUpdateCandidate = (updated: Candidate) => {
    setCurrentCandidate(updated);
    onUpdateCandidate?.(updated);
  };

  const resetToBaseline = () => setSimulatedConstraints(currentCandidate.constraints);

  const effectiveCandidate = useMemo<Candidate>(
    () => ({ ...currentCandidate, constraints: simulatedConstraints }),
    [currentCandidate, simulatedConstraints]
  );

  const held = heldSkillIds(effectiveCandidate);
  const funnelData = buildFunnelStages(effectiveCandidate, allJobs);
  const feasibilityResults = filterFeasibleJobs(effectiveCandidate, allJobs);
  const feasibleJobs = allJobs.filter((_, i) => feasibilityResults[i].feasible);
  const requestedSkillsData = computeRequestedSkills(feasibleJobs);
  const nearMissData = computeNearMissBuckets(feasibleJobs, held);
  const skillBundlesData = recommendSkillBundles(feasibleJobs, held, LEARN_HOURS_BY_SKILL_ID, 3);

  const qualifiedCount = funnelData.find((f) => f.stage === "Qualified")?.count || 0;

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col justify-between">
      <header className="border-b border-neutral-200/90 bg-white/95 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToOverview}
              className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white font-bold text-sm tracking-tighter shadow-xs">
              R
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-neutral-950">{t.appName}</span>
              <span className="ml-2 text-xs text-neutral-500 font-normal border-l border-neutral-200 pl-2 hidden sm:inline-block">
                {t.candidateDashboard}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-100/80 px-2.5 py-1.5 rounded-md border border-neutral-200/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Offline Ready</span>
            </div>

            <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />

            <button
              type="button"
              id="candidate-profile-btn"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 transition-colors cursor-pointer text-xs font-medium text-neutral-900 shadow-2xs"
            >
              <div className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-[10px]">
                {currentCandidate.displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <span className="hidden sm:inline-block font-medium">{currentCandidate.displayName.split(" ")[0]}</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300/60">
                Profile
              </span>
            </button>
          </div>
        </div>
      </header>

      <CandidateProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        candidate={currentCandidate}
        onUpdateCandidate={handleUpdateCandidate}
        language={language}
      />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-8">
        <ExperienceInput
          candidate={currentCandidate}
          onUpdateCandidate={handleUpdateCandidate}
          feasibleJobsCount={funnelData.find((f) => f.stage === "Feasible")?.count ?? 0}
          qualifiedJobsCount={qualifiedCount}
          language={language}
        />

        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
                  <User className="w-4 h-4 text-neutral-700" />
                </div>
                <h1 className="text-base font-bold text-neutral-950">{currentCandidate.displayName}</h1>
              </div>
              <p className="text-xs text-neutral-500">{t.profileEvalNotice}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-md border border-neutral-200 text-neutral-800">
                <MapPin className="w-3 h-3 text-neutral-400" />
                <span>{t.commuteDistance}: {currentCandidate.constraints.maxCommuteMinutes} min</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-md border border-neutral-200 text-neutral-800">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>
                  {t.hoursWindow}: {formatMinutesOfDay(currentCandidate.constraints.availability.earliestStartMin)}–
                  {formatMinutesOfDay(currentCandidate.constraints.availability.latestEndMin)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-md border border-neutral-200 text-neutral-800">
                <Bus className="w-3 h-3 text-neutral-400" />
                <span>{currentCandidate.constraints.availableModes.map((m) => transportModeLabel(m, language)).join(", ")}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-neutral-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase font-mono tracking-wider">
              {t.profileCompetencies} ({currentCandidate.skillClaims.length}):
            </span>
            {currentCandidate.skillClaims.map((claim) => {
              const isCounted = held.has(claim.skillId);
              return (
                <span
                  key={claim.skillId}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono border ${
                    isCounted ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-medium" : "bg-neutral-50 text-neutral-800 border-neutral-200"
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isCounted ? "text-emerald-700" : "text-neutral-400"}`} />
                  <span>{getSkill(claim.skillId).canonicalName}</span>
                </span>
              );
            })}
          </div>
        </div>

        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">{t.opportunitySummary}</h2>
          <OpportunitySummary funnelData={funnelData} language={language} />
        </section>

        <section aria-labelledby="simulator-heading">
          <OpportunitySimulator
            candidate={currentCandidate}
            allJobs={allJobs}
            simulatedConstraints={simulatedConstraints}
            onUpdateSimulatedConstraints={setSimulatedConstraints}
            onResetToBaseline={resetToBaseline}
            language={language}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">
              {t.economicAnalyticsTitle}
            </h2>
            <span className="text-xs text-neutral-500">{t.derivedDatasetNotice}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <OpportunityFunnel data={funnelData} language={language} />
            <SkillBundlesChart data={skillBundlesData} language={language} />
            <RequestedSkillsChart data={requestedSkillsData} language={language} />
            <NearMissChart data={nearMissData} language={language} />
          </div>
        </section>

        <section>
          <OpportunityList candidate={effectiveCandidate} allJobs={allJobs} />
        </section>

        <section>
          <EmployerMap candidate={effectiveCandidate} employers={employers} jobs={allJobs} language={language} />
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-5 text-xs text-neutral-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reach Civic Platform • Local Skills Feasibility Architecture</span>
          </div>
          <div className="font-mono text-[11px] text-neutral-400">{t.footerEngine}</div>
        </div>
      </footer>
    </div>
  );
};
