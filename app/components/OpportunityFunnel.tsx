import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import type { FunnelStage } from "./dashboard-types";

interface OpportunityFunnelProps {
  data: FunnelStage[];
  language?: LanguageCode;
}

export const OpportunityFunnel: React.FC<OpportunityFunnelProps> = ({ data, language = "en" }) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const localizedData = data.map((d) => {
    let stage = d.stage;
    let description = d.description;
    if (d.stage === "Total jobs") {
      stage = t.totalJobs || "Total jobs";
      description = t.totalJobsSubtext || d.description;
    } else if (d.stage === "Feasible") {
      stage = t.feasibleJobs || "Feasible";
      description = t.feasibleJobsSubtext || d.description;
    } else if (d.stage === "Qualified") {
      stage = t.qualifiedJobs || "Qualified";
      description = t.qualifiedJobsSubtext || d.description;
    }
    return { ...d, stage, description, originalStage: d.stage };
  });

  return (
    <div
      id="chart-opportunity-funnel"
      className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-950 tracking-tight">
            {t.opportunityFunnelTitle || "Opportunity Funnel"}
          </h2>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded border border-neutral-200 uppercase tracking-wider">
            {t.sequentialGateBadge || "Sequential Gate"}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {t.opportunityFunnelDesc || "Progressive feasibility reduction from regional vacancies to qualified matches"}
        </p>
      </div>

      <div className="h-56 sm:h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={localizedData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <XAxis
              type="number"
              domain={[0, "dataMax + 2"]}
              tick={{ fontSize: 11, fill: "#71717a", fontFamily: "monospace" }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={{ stroke: "#e4e4e7" }}
            />
            <YAxis
              type="category"
              dataKey="stage"
              width={140}
              tick={{ fontSize: 11, fill: "#18181b", fontWeight: 600 }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "#f4f4f5" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as FunnelStage;
                  return (
                    <div className="bg-neutral-950 text-white text-xs p-3 rounded-lg shadow-lg border border-neutral-800 max-w-xs">
                      <div className="font-semibold text-neutral-100">{item.stage}</div>
                      <div className="font-mono font-bold mt-1" style={{ color: accentHex }}>
                        {item.count} {t.opportunitiesCount || "opportunities"}
                      </div>
                      <div className="text-neutral-400 text-[11px] mt-1 leading-normal">{item.description}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {localizedData.map((entry, index) => {
                const isHighlight = entry.originalStage === "Feasible";
                return (
                  <Cell
                    key={`funnel-cell-${entry.originalStage || entry.stage}-${index}`}
                    fill={isHighlight ? accentHex : "#27272a"}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-neutral-100 pt-3 mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: "#27272a" }} />
          Regional pool
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: accentHex }} />
          Feasibility gateway
        </span>
      </div>
    </div>
  );
};
