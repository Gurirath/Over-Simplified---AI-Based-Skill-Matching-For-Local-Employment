import React from "react";
import { Sliders, RotateCcw, Info, Check, Zap } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import { simulateCustomConstraints, getConstraintSensitivitySteps } from "@/lib/sensitivity";
import type { Candidate, CandidateConstraints, Job, TransportMode } from "@/lib/types";
import { ALL_TRANSPORT_MODES, transportModeLabel, formatMinutesOfDay, parseMinutesOfDay, DAY_LABELS } from "./adapters";

interface OpportunitySimulatorProps {
  candidate: Candidate;
  allJobs: Job[];
  simulatedConstraints: CandidateConstraints;
  onUpdateSimulatedConstraints: (constraints: CandidateConstraints) => void;
  onResetToBaseline: () => void;
  language?: LanguageCode;
}

export const OpportunitySimulator: React.FC<OpportunitySimulatorProps> = ({
  candidate,
  allJobs,
  simulatedConstraints,
  onUpdateSimulatedConstraints,
  onResetToBaseline,
  language = "en",
}) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const { baselineCount, simulatedCount, additionalJobs } = simulateCustomConstraints(
    candidate,
    allJobs,
    simulatedConstraints
  );

  const singleStepSensitivities = getConstraintSensitivitySteps(candidate, allJobs);

  const handleCommuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSimulatedConstraints({ ...simulatedConstraints, maxCommuteMinutes: parseInt(e.target.value, 10) });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSimulatedConstraints({ ...simulatedConstraints, minMonthlySalary: parseInt(e.target.value, 10) });
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSimulatedConstraints({
      ...simulatedConstraints,
      availability: { ...simulatedConstraints.availability, earliestStartMin: parseMinutesOfDay(e.target.value) },
    });
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSimulatedConstraints({
      ...simulatedConstraints,
      availability: { ...simulatedConstraints.availability, latestEndMin: parseMinutesOfDay(e.target.value) },
    });
  };

  const handleToggleMode = (mode: TransportMode) => {
    const current = simulatedConstraints.availableModes;
    if (current.includes(mode)) {
      if (current.length === 1) return;
      onUpdateSimulatedConstraints({ ...simulatedConstraints, availableModes: current.filter((m) => m !== mode) });
    } else {
      onUpdateSimulatedConstraints({ ...simulatedConstraints, availableModes: [...current, mode] });
    }
  };

  const handleToggleDay = (day: number) => {
    const current = simulatedConstraints.availability.availableDays;
    const next = current.includes(day)
      ? current.length === 1
        ? current
        : current.filter((d) => d !== day)
      : [...current, day].sort();
    onUpdateSimulatedConstraints({
      ...simulatedConstraints,
      availability: { ...simulatedConstraints.availability, availableDays: next },
    });
  };

  const isModified = JSON.stringify(simulatedConstraints) !== JSON.stringify(candidate.constraints);

  return (
    <div id="opportunity-simulator" className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" style={{ color: accentHex }} aria-hidden="true" />
            <h2 className="text-base font-bold text-neutral-950 tracking-tight">
              {t.opportunitySimulatorTitle || "Opportunity Reach Simulator"}
            </h2>
            <span
              className="px-2 py-0.5 text-[11px] font-mono font-medium rounded border"
              style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
            >
              {t.sensitivityEngineBadge || "Interactive Sensitivity Engine"}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            {t.simulatorDesc ||
              "Real-time sensitivity modeling: evaluate how relaxing commute, salary floor, shift timing, or transport access expands your feasible set."}
          </p>
        </div>

        {isModified && (
          <button
            type="button"
            onClick={onResetToBaseline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-300 transition-colors self-start cursor-pointer font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetSimulation || "Reset to Baseline"}</span>
          </button>
        )}
      </div>

      <div className="my-5 p-5 rounded-xl bg-neutral-950 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 shadow-md border border-neutral-800">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-400">
            {t.activeSimReach || "Active Simulated Reach"}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-mono text-white">{simulatedCount}</span>
            <span className="text-sm text-neutral-300 font-sans font-normal">
              {t.feasibleOpportunitiesAccessible || "feasible opportunities accessible"}
            </span>
          </div>
        </div>

        <div className="sm:border-l sm:border-neutral-800 sm:pl-6 flex items-center gap-3.5">
          <div
            className="px-4 py-2.5 rounded-lg font-mono text-center flex flex-col items-center justify-center"
            style={{ backgroundColor: additionalJobs > 0 ? accentHex : "#27272a", color: additionalJobs > 0 ? "#fff" : "#d4d4d8" }}
          >
            <span className="text-[10px] font-sans font-normal opacity-80 uppercase tracking-wider">
              {t.deltaVsBase || "Delta vs Base"}
            </span>
            <span className="text-xl sm:text-2xl font-bold">{additionalJobs >= 0 ? `+${additionalJobs}` : additionalJobs}</span>
          </div>
          <div className="text-xs text-neutral-300 leading-tight max-w-[160px]">
            {additionalJobs > 0 ? (
              <span className="font-semibold" style={{ color: accentHex }}>
                +{additionalJobs} {t.additionalOpportunitiesUnlocked || "additional opportunities unlocked"}
              </span>
            ) : additionalJobs < 0 ? (
              <span>{t.constrainedBelowBaseline || "Constrained below baseline"} ({baselineCount} base)</span>
            ) : (
              <span>{t.matchingBaseProfile || "Matching your baseline profile"} ({baselineCount} base)</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="space-y-2.5 p-4 bg-neutral-50/70 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <label htmlFor="slider-commute" className="text-xs font-bold text-neutral-900">
              1. Maximum Commute
            </label>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border shadow-2xs"
              style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
            >
              {simulatedConstraints.maxCommuteMinutes} min
            </span>
          </div>
          <input
            id="slider-commute"
            type="range"
            min="10"
            max="120"
            step="5"
            value={simulatedConstraints.maxCommuteMinutes}
            onChange={handleCommuteChange}
            className="w-full cursor-pointer h-2 bg-neutral-200 rounded-lg"
            style={{ accentColor: accentHex }}
          />
          <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>10 min (walk)</span>
            <span>Base: {candidate.constraints.maxCommuteMinutes} min</span>
            <span>120 min</span>
          </div>
        </div>

        <div className="space-y-2.5 p-4 bg-neutral-50/70 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <label htmlFor="slider-salary" className="text-xs font-bold text-neutral-900">
              2. Minimum Salary Floor
            </label>
            <span className="text-xs font-mono font-bold text-neutral-800 bg-white px-2.5 py-0.5 rounded border border-neutral-200 shadow-2xs">
              Rs{simulatedConstraints.minMonthlySalary.toLocaleString("en-IN")}
            </span>
          </div>
          <input
            id="slider-salary"
            type="range"
            min="0"
            max="25000"
            step="500"
            value={simulatedConstraints.minMonthlySalary}
            onChange={handleSalaryChange}
            className="w-full cursor-pointer h-2 bg-neutral-200 rounded-lg"
            style={{ accentColor: accentHex }}
          />
          <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>Rs0</span>
            <span>Base: Rs{candidate.constraints.minMonthlySalary.toLocaleString("en-IN")}</span>
            <span>Rs25,000</span>
          </div>
        </div>

        <div className="space-y-2.5 p-4 bg-neutral-50/70 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <label htmlFor="select-start-time" className="text-xs font-bold text-neutral-900">
              3. Earliest Shift Start
            </label>
            <span className="text-xs font-mono font-bold text-neutral-800 bg-white px-2.5 py-0.5 rounded border border-neutral-200 shadow-2xs">
              {formatMinutesOfDay(simulatedConstraints.availability.earliestStartMin)}
            </span>
          </div>
          <input
            id="select-start-time"
            type="time"
            value={formatMinutesOfDay(simulatedConstraints.availability.earliestStartMin)}
            onChange={handleStartTimeChange}
            className="w-full text-xs font-mono p-2 bg-white border border-neutral-300 rounded-md focus:outline-none cursor-pointer text-neutral-900"
          />
        </div>

        <div className="space-y-2.5 p-4 bg-neutral-50/70 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <label htmlFor="select-end-time" className="text-xs font-bold text-neutral-900">
              4. Latest Shift End
            </label>
            <span className="text-xs font-mono font-bold text-neutral-800 bg-white px-2.5 py-0.5 rounded border border-neutral-200 shadow-2xs">
              {formatMinutesOfDay(simulatedConstraints.availability.latestEndMin)}
            </span>
          </div>
          <input
            id="select-end-time"
            type="time"
            value={formatMinutesOfDay(simulatedConstraints.availability.latestEndMin)}
            onChange={handleEndTimeChange}
            className="w-full text-xs font-mono p-2 bg-white border border-neutral-300 rounded-md focus:outline-none cursor-pointer text-neutral-900"
          />
        </div>

        <div className="space-y-2.5 p-4 bg-neutral-50/70 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900">5. Usable Transport Modes</span>
            <span className="text-xs text-neutral-500 font-mono">
              {simulatedConstraints.availableModes.length} {t.modesActive || "modes active"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            {ALL_TRANSPORT_MODES.map((mode) => {
              const active = simulatedConstraints.availableModes.includes(mode);
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleToggleMode(mode)}
                  className={`py-2 px-2.5 text-xs font-medium rounded-md border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    active ? "bg-neutral-950 text-white border-neutral-950 shadow-2xs" : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {active && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  <span>{transportModeLabel(mode, language)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5 p-4 bg-neutral-50/70 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900">6. Available Days</span>
            <span className="text-xs text-neutral-500 font-mono">
              {simulatedConstraints.availability.availableDays.length} / 7 days
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 pt-0.5">
            {DAY_LABELS.map((label, day) => {
              const active = simulatedConstraints.availability.availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleToggleDay(day)}
                  className={`py-2 text-[11px] font-medium rounded-md border transition-all cursor-pointer text-center ${
                    active ? "bg-neutral-950 text-white border-neutral-950 shadow-2xs" : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-neutral-100">
        <div className="text-xs font-semibold text-neutral-800 mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: accentHex }} />
          <span>{t.singleConstraintRelaxation || "Single-Constraint Relaxation Sensitivity Benchmarks:"}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {singleStepSensitivities.map((step) => (
            <div
              key={step.constraintName}
              className="p-3 bg-neutral-50/50 border border-neutral-200 rounded-lg text-xs space-y-1.5 hover:bg-white transition-colors"
            >
              <div className="font-bold text-neutral-900 truncate text-xs">{step.constraintName}</div>
              <div className="text-neutral-500 text-[11px] truncate font-mono">{step.relaxedValue}</div>
              <div className="flex items-center justify-between font-mono pt-1 text-[11px] border-t border-neutral-100">
                <span className="text-neutral-500 font-sans">{t.yieldLabel || "Yield:"}</span>
                <span className="font-bold" style={{ color: step.additionalJobs > 0 ? accentHex : "#71717a" }}>
                  +{step.additionalJobs} ({step.newFeasibleCount} {t.totalLabel || "total"})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start sm:items-center gap-2 text-xs text-neutral-600">
        <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong>Simulation Mode:</strong>{" "}
          {t.simulatorCivicDisclaimer ||
            "Controls compute access dynamically in-browser. Adjustments do not overwrite your saved profile or notify employers."}
        </span>
      </div>
    </div>
  );
};
