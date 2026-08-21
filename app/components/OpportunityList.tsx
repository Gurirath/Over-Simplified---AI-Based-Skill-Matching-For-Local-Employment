import React, { useState } from "react";
import { Check, AlertCircle, MapPin, Clock, Bus, Search, CheckCircle2 } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { getSkill } from "@/lib/normalize";
import { evaluateAllJobs, heldSkillIds, DAY_LABELS, formatMinutesOfDay } from "./adapters";
import type { Candidate, Job } from "@/lib/types";

interface OpportunityListProps {
  candidate: Candidate;
  allJobs: Job[];
}

type FilterTab = "feasible" | "qualified" | "near_miss" | "all";

export const OpportunityList: React.FC<OpportunityListProps> = ({ candidate, allJobs }) => {
  const { accentHex } = useTheme();
  const [filterTab, setFilterTab] = useState<FilterTab>("feasible");
  const [searchQuery, setSearchQuery] = useState("");

  const held = heldSkillIds(candidate);
  const evaluated = evaluateAllJobs(candidate, allJobs);

  const filtered = evaluated.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText =
        item.job.title.toLowerCase().includes(q) ||
        item.job.employerName.toLowerCase().includes(q) ||
        item.job.requiredSkills.some((s) => getSkill(s).canonicalName.toLowerCase().includes(q));
      if (!matchText) return false;
    }

    if (filterTab === "feasible") return item.feasibility.feasible;
    if (filterTab === "qualified") return item.feasibility.feasible && item.qualifiedNow;
    if (filterTab === "near_miss")
      return item.feasibility.feasible && !item.qualifiedNow && item.missingRequired.length <= 2;
    return true;
  });

  const feasibleCount = evaluated.filter((e) => e.feasibility.feasible).length;
  const qualifiedCount = evaluated.filter((e) => e.feasibility.feasible && e.qualifiedNow).length;
  const nearMissCount = evaluated.filter(
    (e) => e.feasibility.feasible && !e.qualifiedNow && e.missingRequired.length <= 2
  ).length;

  return (
    <div id="opportunity-list-container" className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div>
          <h2 className="text-sm font-bold text-neutral-950 tracking-tight">Opportunities by Reach & Skill Alignment</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Transparent breakdown of why opportunities match or fall just outside reach
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter title, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none text-neutral-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs border-b border-neutral-100 pb-2.5">
        <button
          type="button"
          onClick={() => setFilterTab("feasible")}
          className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
            filterTab === "feasible" ? "bg-neutral-950 text-white shadow-2xs" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
          }`}
        >
          Feasible ({feasibleCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("qualified")}
          className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
            filterTab === "qualified" ? "text-white shadow-2xs" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
          }`}
          style={{ backgroundColor: filterTab === "qualified" ? accentHex : undefined }}
        >
          Fully Qualified ({qualifiedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("near_miss")}
          className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
            filterTab === "near_miss" ? "bg-neutral-900 text-white shadow-2xs" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
          }`}
        >
          Near-Miss (1–2 skills away) ({nearMissCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
            filterTab === "all" ? "bg-neutral-950 text-white shadow-2xs" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
          }`}
        >
          All Opportunities ({allJobs.length})
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-500 font-mono">
            No opportunities match the selected filter criteria.
          </div>
        ) : (
          filtered.map((item) => {
            const { job, feasibility, qualifiedNow, missingRequired, reasonSentences } = item;

            return (
              <div
                key={job.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  feasibility.feasible
                    ? "border-neutral-200 bg-white shadow-xs"
                    : "border-neutral-200 bg-neutral-50/70 opacity-75"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-neutral-950">{job.title}</h3>
                      {feasibility.feasible ? (
                        qualifiedNow ? (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                            style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
                          >
                            QUALIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            NEAR MISS ({missingRequired.length} SKILL GAP)
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-200 text-neutral-700">
                          OUTSIDE REACH
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-600 font-medium">{job.employerName}</div>
                  </div>

                  <div className="font-mono text-xs font-bold text-neutral-950 shrink-0 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200 self-start">
                    Rs{job.salaryMin.toLocaleString("en-IN")}–{job.salaryMax.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    {feasibility.bestCommute ? (
                      <span>
                        <strong className="font-mono">{Math.round(feasibility.bestCommute.minutes)} min</strong> by{" "}
                        {feasibility.bestCommute.mode.replace("_", " ")}
                      </span>
                    ) : (
                      <span>No route within your transport modes</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>
                      Shift: <strong className="font-mono">{formatMinutesOfDay(job.shift.startMin)}–{formatMinutesOfDay(job.shift.endMin)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <Bus className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="flex gap-1">
                      {job.shift.days.map((d) => (
                        <span key={d} className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono text-[10px]">
                          {DAY_LABELS[d]}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100">
                  <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                    Required Competencies
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skillId) => {
                      const hasSkill = held.has(skillId);
                      return (
                        <span
                          key={skillId}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono border ${
                            hasSkill ? "" : "bg-neutral-100 text-neutral-500 border-neutral-200 line-through decoration-neutral-400"
                          }`}
                          style={hasSkill ? { backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" } : undefined}
                        >
                          {hasSkill ? <Check className="w-3 h-3" style={{ color: accentHex }} /> : <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />}
                          <span>{getSkill(skillId).canonicalName}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {!feasibility.feasible && (
                  <div className="mt-3 p-2.5 bg-neutral-100 rounded-md text-xs text-neutral-700 flex items-start gap-2 border border-neutral-200">
                    <AlertCircle className="w-3.5 h-3.5 text-neutral-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-neutral-900 text-[11px]">Constraint Gate Breakdown:</div>
                      <ul className="list-disc list-inside text-[11px] text-neutral-600">
                        {reasonSentences.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {feasibility.feasible && qualifiedNow && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    You hold every required skill for this role.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
