import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import type { RequestedSkillItem } from "./dashboard-types";

interface RequestedSkillsChartProps {
  data: RequestedSkillItem[];
  language?: LanguageCode;
}

export const RequestedSkillsChart: React.FC<RequestedSkillsChartProps> = ({ data, language = "en" }) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div
      id="chart-requested-skills"
      className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-950 tracking-tight">
            {t.requestedSkillsTitle || "Skills Requested Nearby"}
          </h2>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded border border-neutral-200 uppercase tracking-wider">
            {t.feasibleOnlyBadge || "Feasible Only"}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {t.requestedSkillsDesc || "Number of unique regional employers demanding each skill within your commute zone"}
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full mt-4">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-neutral-500 italic">
            {t.noFeasibleFound || "No feasible opportunities found with current constraints."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 10, right: 35, left: 10, bottom: 5 }}>
              <XAxis
                type="number"
                domain={[0, "dataMax + 1"]}
                tick={{ fontSize: 11, fill: "#71717a", fontFamily: "monospace" }}
                axisLine={{ stroke: "#e4e4e7" }}
                tickLine={{ stroke: "#e4e4e7" }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="skillName"
                width={150}
                tick={{ fontSize: 11, fill: "#18181b", fontWeight: 600 }}
                axisLine={{ stroke: "#e4e4e7" }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f4f4f5" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as RequestedSkillItem;
                    return (
                      <div className="bg-neutral-950 text-white text-xs p-3 rounded-lg shadow-lg border border-neutral-800">
                        <div className="font-semibold text-neutral-100">{item.skillName}</div>
                        <div className="font-mono font-bold mt-1" style={{ color: accentHex }}>
                          {item.employerCount} {t.distinctEmployers || "distinct employers"}
                        </div>
                        <div className="text-neutral-300 text-[11px] mt-0.5">
                          {t.presentAcrossVacancies || "Present across"} {item.jobCount} {t.vacanciesCount || "vacancies"}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="employerCount" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`req-skill-cell-${entry.skillId}-${index}`} fill={index < 2 ? accentHex : "#27272a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-3 mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <span>Scale: Distinct Employers</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: accentHex }} />
          Top Requested Skills
        </span>
      </div>
    </div>
  );
};
