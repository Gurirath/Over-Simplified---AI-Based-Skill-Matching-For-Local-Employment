"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  PlusCircle,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  Users,
  HardDriveDownload,
} from "lucide-react";
import type { Candidate, Employer, Job } from "@/lib/types";
import type { JobIngestResult } from "@/lib/extract";
import { bestCommute } from "@/lib/commute";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import { LanguageSelector } from "./LanguageSelector";
import { EmployerProfileModal } from "./EmployerProfileModal";
import { employerTypeLabel } from "./employerTypeMap";
import { formatMinutesOfDay, DAY_LABELS } from "./adapters";

const EmployerMap = dynamic(() => import("./EmployerMap").then((m) => m.EmployerMap), { ssr: false });

interface EmployerDashboardProps {
  employers: Employer[];
  jobs: Job[];
  candidate: Candidate;
  onBackToOverview: () => void;
  onGoToCandidate: () => void;
  onAddJob: (newJob: Job) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  employers,
  jobs,
  candidate,
  onBackToOverview,
  onAddJob,
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];

  const [selectedEmployerId, setSelectedEmployerId] = useState<string>(employers[0]?.id || "");
  const currentEmployer = employers.find((e) => e.id === selectedEmployerId) || employers[0];

  const employerJobs = jobs.filter((j) => j.employerName === currentEmployer?.name);

  const [description, setDescription] = useState("");
  const [areaName, setAreaName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<JobIngestResult | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const commute = currentEmployer
    ? bestCommute(candidate.location, { lat: currentEmployer.lat, lng: currentEmployer.lng }, candidate.constraints.availableModes)
    : null;
  const inCandidateReach = commute !== null && commute.minutes <= candidate.constraints.maxCommuteMinutes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployer || !description.trim() || !areaName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setLastResult(null);

    try {
      const res = await fetch("/api/extract-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          id: `JOB_LIVE_${Date.now()}`,
          employerName: currentEmployer.name,
          areaName,
          location: { lat: currentEmployer.lat, lng: currentEmployer.lng },
        }),
      });
      const data = (await res.json()) as JobIngestResult & { fromCache?: boolean; error?: string };

      if (!res.ok || !data.job) {
        throw new Error(data.error || "Job extraction failed");
      }

      onAddJob(data.job);
      setLastResult(data);
      setDescription("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong posting this opportunity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentEmployer) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col justify-between">
      <header className="border-b border-neutral-200/90 bg-white/95 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToOverview}
              className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white font-bold text-sm tracking-tighter shadow-xs">
              R
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-neutral-950">{t.appName}</span>
              <span className="ml-2 text-xs text-neutral-500 font-normal border-l border-neutral-200 pl-2 hidden sm:inline-block">
                Employer Dashboard
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
              id="employer-profile-btn"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 transition-colors cursor-pointer text-xs font-medium text-neutral-900 shadow-2xs"
            >
              <div className="w-5 h-5 rounded-md bg-neutral-950 text-white flex items-center justify-center font-bold text-[10px]">
                <Building2 className="w-3 h-3" />
              </div>
              <span className="hidden sm:inline-block font-medium max-w-[120px] truncate">{currentEmployer.name.split(" ")[0]}</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300/60">
                Facility
              </span>
            </button>
          </div>
        </div>
      </header>

      <EmployerProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} employer={currentEmployer} jobs={jobs} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-8">
        <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-100">
            <div>
              <h1 className="text-base font-bold text-neutral-950 tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neutral-700" />
                <span>{t.businessInfo}</span>
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">Select a registered facility from local OpenStreetMap records</p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="employer-select" className="text-xs text-neutral-600 font-medium shrink-0">
                Facility:
              </label>
              <select
                id="employer-select"
                value={selectedEmployerId}
                onChange={(e) => setSelectedEmployerId(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer max-w-xs truncate font-medium text-neutral-800"
              >
                {employers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({employerTypeLabel(emp.employerType)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-neutral-50/70 p-4 rounded-lg border border-neutral-200">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider font-mono">Site Name</span>
              <span className="font-semibold text-neutral-900 mt-0.5 block">{currentEmployer.name}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider font-mono">Facility Sector</span>
              <span className="font-semibold text-neutral-900 mt-0.5 block">{employerTypeLabel(currentEmployer.employerType)}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider font-mono">Coordinates / OSM</span>
              <span className="font-mono text-neutral-800 mt-0.5 block">
                {currentEmployer.lat.toFixed(4)}, {currentEmployer.lng.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider font-mono">OSM Reference</span>
              <span className="font-semibold text-neutral-900 mt-0.5 block">{currentEmployer.osmType}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-950 tracking-tight flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-neutral-700" />
                <span>{t.postOpportunity}</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Describe the opening in plain language — title, skills, pay, and shift are extracted automatically.
              </p>
            </div>

            {lastResult && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>&ldquo;{lastResult.job.title}&rdquo; published to the local job registry.</span>
                </div>
                {lastResult.missingFields.length > 0 && (
                  <div className="text-amber-800 font-mono text-[11px]">
                    Defaults applied for: {lastResult.missingFields.join(", ")} — edit if these don&apos;t match.
                  </div>
                )}
                {lastResult.unmatchedMentions.length > 0 && (
                  <div className="text-neutral-600 font-mono text-[11px]">
                    Not matched to our skill taxonomy: {lastResult.unmatchedMentions.join(", ")}
                  </div>
                )}
              </div>
            )}

            {submitError && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">{submitError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Area / Locality Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Katpadi"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 text-xs transition-colors text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Position Description *</label>
                <textarea
                  rows={6}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Need a counter assistant for our bakery, morning shift 7am-3pm, six days a week, must handle cash and know basic billing. Pays 11000-14000 a month."
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !description.trim() || !areaName.trim()}
                className={`w-full py-2.5 font-medium text-xs rounded-md transition-colors shadow-xs ${
                  isSubmitting || !description.trim() || !areaName.trim()
                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "bg-neutral-950 text-white hover:bg-neutral-800 cursor-pointer"
                }`}
              >
                {isSubmitting ? "Extracting…" : "Publish Local Opportunity"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neutral-700" />
                  <span>{t.localReachSim}</span>
                </h3>
              </div>

              <div className="p-3.5 bg-neutral-50/70 rounded-lg border border-neutral-200 space-y-1">
                <div className="text-[11px] text-neutral-500 font-mono">Feasibility for the sample worker profile</div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-800 text-xs">Best commute:</span>
                  <span className="font-mono font-bold text-neutral-950">
                    {commute ? `${Math.round(commute.minutes)} min` : "no route"}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                  {inCandidateReach ? (
                    <span className="text-emerald-700 font-medium">✓ Inside their {candidate.constraints.maxCommuteMinutes}-minute commute ceiling</span>
                  ) : (
                    <span className="text-amber-700 font-medium">⚠ Outside their commute ceiling with current transport modes</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Facility Postings ({employerJobs.length})</span>
                </h3>
              </div>

              {employerJobs.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500 italic">No vacancies currently posted for this facility.</div>
              ) : (
                <div className="space-y-2">
                  {employerJobs.map((j) => (
                    <div key={j.id} className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200 text-xs space-y-1.5">
                      <div className="font-semibold text-neutral-900">{j.title}</div>
                      <div className="flex items-center justify-between text-neutral-500 text-[11px] font-mono">
                        <span>
                          {formatMinutesOfDay(j.shift.startMin)}–{formatMinutesOfDay(j.shift.endMin)}
                        </span>
                        <span>
                          Rs{j.salaryMin.toLocaleString("en-IN")}–{j.salaryMax.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {j.shift.days.map((d) => (
                          <span key={d} className="px-1 py-0.5 rounded bg-white border border-neutral-200 font-mono text-[9px]">
                            {DAY_LABELS[d]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <section aria-labelledby="employer-map-heading" className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 id="employer-map-heading" className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">
              Regional Geographic Context
            </h2>
          </div>
          <EmployerMap candidate={candidate} employers={employers} jobs={jobs} language={language} />
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-5 text-xs text-neutral-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reach Civic Platform • Local Employer Facility Management</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
