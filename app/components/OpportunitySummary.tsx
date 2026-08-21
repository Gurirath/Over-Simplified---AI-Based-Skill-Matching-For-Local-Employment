import React from "react";
import { Briefcase, CheckCircle2, Navigation } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import type { FunnelStage } from "./dashboard-types";

interface OpportunitySummaryProps {
  funnelData: FunnelStage[];
  language?: LanguageCode;
}

export const OpportunitySummary: React.FC<OpportunitySummaryProps> = ({ funnelData, language = "en" }) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const totalCount = funnelData.find((f) => f.stage === "Total jobs")?.count || 0;
  const feasibleCount = funnelData.find((f) => f.stage === "Feasible")?.count || 0;
  const qualifiedCount = funnelData.find((f) => f.stage === "Qualified")?.count || 0;

  const cards = [
    {
      id: "summary-total-jobs",
      title: t.totalJobs || "Total Regional Jobs",
      value: totalCount,
      subtext: t.totalJobsSubtext || "Identified employer vacancies in area",
      icon: Briefcase,
      accent: false,
    },
    {
      id: "summary-feasible-jobs",
      title: t.feasibleJobs || "Feasible Opportunities",
      value: feasibleCount,
      subtext: t.feasibleJobsSubtext || "Within commute, salary, and shift constraints",
      icon: Navigation,
      accent: true,
    },
    {
      id: "summary-qualified-jobs",
      title: t.qualifiedJobs || "Directly Qualified",
      value: qualifiedCount,
      subtext: t.qualifiedJobsSubtext || "Matches every required skill you hold",
      icon: CheckCircle2,
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            id={card.id}
            key={card.id}
            className={`p-5 rounded-xl border transition-all ${
              card.accent ? "shadow-2xs" : "bg-white border-neutral-200/90 text-neutral-900 shadow-xs"
            }`}
            style={card.accent ? { backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)" } : undefined}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold tracking-tight ${card.accent ? "text-neutral-900" : "text-neutral-600"}`}>
                {card.title}
              </span>
              <Icon className="w-4 h-4" style={{ color: card.accent ? accentHex : undefined }} aria-hidden="true" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono"
                style={{ color: card.accent ? "var(--accent-fg)" : undefined }}
              >
                {card.value}
              </span>
              <span className="text-xs text-neutral-500 font-sans font-medium">{t.vacanciesCount || "vacancies"}</span>
            </div>

            <p className="mt-1.5 text-xs text-neutral-500 leading-normal">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};
