import React, { useState } from "react";
import { X, MapPin, Clock, Bus, CheckCircle2, Save } from "lucide-react";
import type { Candidate } from "@/lib/types";
import { getSkill } from "@/lib/normalize";
import {
  heldSkillIds,
  formatMinutesOfDay,
  parseMinutesOfDay,
  DAY_LABELS,
  EVIDENCE_TIER_LABELS,
  transportModeLabel,
} from "./adapters";
import type { LanguageCode } from "./i18n";

interface CandidateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onUpdateCandidate: (updated: Candidate) => void;
  language?: LanguageCode;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onUpdateCandidate,
  language = "en",
}) => {
  const [displayName, setDisplayName] = useState(candidate.displayName);
  const [maxCommuteMinutes, setMaxCommuteMinutes] = useState(candidate.constraints.maxCommuteMinutes);
  const [earliestStart, setEarliestStart] = useState(formatMinutesOfDay(candidate.constraints.availability.earliestStartMin));
  const [latestEnd, setLatestEnd] = useState(formatMinutesOfDay(candidate.constraints.availability.latestEndMin));
  const [availableDays, setAvailableDays] = useState<number[]>(candidate.constraints.availability.availableDays);
  const [isEditing, setIsEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? (prev.length === 1 ? prev : prev.filter((d) => d !== day)) : [...prev, day].sort()
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCandidate({
      ...candidate,
      displayName,
      constraints: {
        ...candidate.constraints,
        maxCommuteMinutes: Number(maxCommuteMinutes),
        availability: {
          ...candidate.constraints.availability,
          earliestStartMin: parseMinutesOfDay(earliestStart),
          latestEndMin: parseMinutesOfDay(latestEnd),
          availableDays,
        },
      },
    });
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const held = heldSkillIds(candidate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-950 text-white font-bold flex items-center justify-center text-sm">
              {candidate.displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">{candidate.displayName}</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Candidate profile</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {savedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/50 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile preferences updated successfully.</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Max Commute (minutes)</label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="180"
                    value={maxCommuteMinutes}
                    onChange={(e) => setMaxCommuteMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Available Hours</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={earliestStart}
                      onChange={(e) => setEarliestStart(e.target.value)}
                      className="w-full px-2 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-md font-mono"
                    />
                    <span className="text-xs text-neutral-400">–</span>
                    <input
                      type="time"
                      value={latestEnd}
                      onChange={(e) => setLatestEnd(e.target.value)}
                      className="w-full px-2 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Available Days</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_LABELS.map((label, day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-2 text-[11px] font-medium rounded-md border transition-all cursor-pointer text-center ${
                        availableDays.includes(day) ? "bg-neutral-950 text-white border-neutral-950" : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-md border border-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Commute Limit</span>
                  </div>
                  <div className="text-sm font-semibold text-neutral-900 mt-1 font-mono">{candidate.constraints.maxCommuteMinutes} min</div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Shift Availability</span>
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 mt-1 font-mono">
                    {formatMinutesOfDay(candidate.constraints.availability.earliestStartMin)}–
                    {formatMinutesOfDay(candidate.constraints.availability.latestEndMin)}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <Bus className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Transit Modes</span>
                  </div>
                  <div className="text-xs font-medium text-neutral-900 mt-1">
                    {candidate.constraints.availableModes.map((m) => transportModeLabel(m, language)).join(", ")}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50/60 rounded-lg border border-neutral-200/70 text-xs">
                <div className="font-semibold text-neutral-700 mb-1.5">Available Days</div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.constraints.availability.availableDays.map((d) => (
                    <span key={d} className="px-2 py-0.5 rounded bg-white border border-neutral-200 font-mono text-[11px]">
                      {DAY_LABELS[d]}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-800 uppercase font-mono tracking-wider">
                    Skills ({candidate.skillClaims.length})
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">{held.size} counted toward matches</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skillClaims.map((claim) => (
                    <span
                      key={claim.skillId}
                      className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                        held.has(claim.skillId) ? "bg-emerald-50/80 text-emerald-900 border-emerald-200/60 font-medium" : "bg-neutral-100 text-neutral-700 border-neutral-200"
                      }`}
                    >
                      {held.has(claim.skillId) && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      <span>{getSkill(claim.skillId).canonicalName}</span>
                      <span className="text-[9px] text-neutral-400 font-mono">{EVIDENCE_TIER_LABELS[claim.tier]}</span>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          {!isEditing ? (
            <button type="button" onClick={() => setIsEditing(true)} className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline cursor-pointer">
              Edit Preferences
            </button>
          ) : (
            <div />
          )}
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
