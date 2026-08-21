"use client";

import React, { useEffect, useState } from "react";
import { LandingHero } from "./components/LandingHero";
import { CandidateDashboard } from "./components/CandidateDashboard";
import { EmployerDashboard } from "./components/EmployerDashboard";
import type { LanguageCode } from "./components/i18n";
import type { Candidate, Employer, Job } from "@/lib/types";
import type { CandidateIngestResult } from "@/lib/extract";

import jobsData from "@/data/jobs.json";
import employersData from "@/data/employers.json";
import personasData from "@/data/personas.json";

const SEED_JOBS = jobsData as Job[];
const SEED_EMPLOYERS = employersData as Employer[];

interface PersonaSeed {
  id: string;
  displayName: string;
  age?: number;
  location: { lat: number; lng: number };
  rawStory: string;
  constraints: Candidate["constraints"];
}

const PERSONAS = personasData as PersonaSeed[];
const SEED_PERSONA = PERSONAS[0] ?? null;

type ActiveView = "landing" | "candidate" | "employer";

/**
 * Phase 2 shell: mounts the merged UI on our data + lib. Seeds the worker
 * profile from the first demo persona (Devi) via the real
 * /api/extract-candidate route — cached per CLAUDE.md §11, so this loads
 * with no network. Login/role selection (CLAUDE.md §15) and the "try a
 * sample profile" persona dropdown (§5 of the user's plan) land in a later
 * phase; this page only proves the merged UI runs on the real backend.
 */
export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("landing");
  const [language, setLanguage] = useState<LanguageCode>("en");

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employers] = useState<Employer[]>(SEED_EMPLOYERS);
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);

  useEffect(() => {
    if (!SEED_PERSONA) return;
    const seedPersona = SEED_PERSONA;

    let cancelled = false;

    fetch("/api/extract-candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story: seedPersona.rawStory }),
    })
      .then(async (res) => {
        const data = (await res.json()) as CandidateIngestResult & { error?: string };
        if (!res.ok || !Array.isArray(data.claims)) {
          throw new Error(data.error || "Failed to seed the demo profile");
        }
        if (cancelled) return;
        setCandidate({
          id: seedPersona.id,
          displayName: seedPersona.displayName,
          age: seedPersona.age,
          location: seedPersona.location,
          rawStory: seedPersona.rawStory,
          skillClaims: data.claims,
          constraints: seedPersona.constraints,
        });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to seed the demo profile");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddJob = (newJob: Job) => setJobs((prev) => [newJob, ...prev]);
  const handleUpdateCandidate = (updated: Candidate) => setCandidate(updated);

  if (activeView === "candidate" || activeView === "employer") {
    if (!SEED_PERSONA) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] text-neutral-700 text-sm px-6 text-center">
          No demo persona found in data/personas.json
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] text-neutral-700 text-sm px-6 text-center">
          Couldn&apos;t load the demo profile: {loadError}
        </div>
      );
    }
    if (!candidate) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] text-neutral-500 text-sm">
          Loading demo profile…
        </div>
      );
    }
  }

  return (
    <>
      {activeView === "candidate" && candidate && (
        <CandidateDashboard
          key={candidate.id}
          candidate={candidate}
          onUpdateCandidate={handleUpdateCandidate}
          employers={employers}
          allJobs={jobs}
          onBackToOverview={() => setActiveView("landing")}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {activeView === "employer" && candidate && (
        <EmployerDashboard
          employers={employers}
          jobs={jobs}
          candidate={candidate}
          onBackToOverview={() => setActiveView("landing")}
          onGoToCandidate={() => setActiveView("candidate")}
          onAddJob={handleAddJob}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {activeView === "landing" && (
        <LandingHero
          onSelectCandidate={() => setActiveView("candidate")}
          onSelectEmployer={() => setActiveView("employer")}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
    </>
  );
}
