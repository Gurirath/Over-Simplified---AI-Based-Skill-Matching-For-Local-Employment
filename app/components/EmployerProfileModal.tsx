import React from "react";
import { Building2, X, Briefcase, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { Employer, Job } from "@/lib/types";
import { employerTypeLabel } from "./employerTypeMap";
import { formatMinutesOfDay } from "./adapters";

interface EmployerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employer: Employer;
  jobs: Job[];
}

export const EmployerProfileModal: React.FC<EmployerProfileModalProps> = ({ isOpen, onClose, employer, jobs }) => {
  if (!isOpen) return null;

  const employerJobs = jobs.filter((j) => j.employerName === employer.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-950 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 line-clamp-1">{employer.name}</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>{employerTypeLabel(employer.employerType)} · from OpenStreetMap</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
              <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                <span>Active Postings</span>
              </div>
              <div className="text-base font-bold text-neutral-900 mt-1 font-mono">{employerJobs.length} Openings</div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
              <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Source</span>
              </div>
              <div className="text-xs font-semibold text-neutral-700 mt-1 font-mono">{employer.osmType}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-800 uppercase font-mono tracking-wider mb-2">
              Current Vacancies ({employerJobs.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {employerJobs.length === 0 ? (
                <div className="py-4 text-center text-xs text-neutral-500 italic">No vacancies currently posted.</div>
              ) : (
                employerJobs.map((j) => (
                  <div key={j.id} className="p-2 bg-neutral-50 rounded border border-neutral-200/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-neutral-900">{j.title}</span>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {formatMinutesOfDay(j.shift.startMin)}–{formatMinutesOfDay(j.shift.endMin)} · Rs{j.salaryMin.toLocaleString("en-IN")}–{j.salaryMax.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {j.requiredSkills.length} skills
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
