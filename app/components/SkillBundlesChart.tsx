import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import { getSkill } from "@/lib/normalize";
import type { SkillBundleRecommendation } from "@/lib/types";

interface SkillBundlesChartProps {
  data: SkillBundleRecommendation[];
  language?: LanguageCode;
}

export const SkillBundlesChart: React.FC<SkillBundlesChartProps> = ({ data, language = "en" }) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const chartData = data.slice(0, 5).map((bundle) => ({
    ...bundle,
    bundleLabel: bundle.skillIds.map((id) => getSkill(id).canonicalName).join(" + "),
  }));

  return (
    <div
      id="chart-top-skill-bundles"
      className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-950 tracking-tight">
            {t.topSkillBundlesTitle || "Top Skill Bundles"}
          </h2>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded border border-neutral-200 uppercase tracking-wider">
            {t.trainingRoiBadge || "Training ROI"}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {t.skillBundlesDesc || "Ranked by unlocked regional jobs per 10 hours of training investment (jobsPer10Hours)"}
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full mt-4">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-neutral-500 italic">
            {t.noFeasibleFound || "No skill bundles to recommend — every feasible job is already qualified."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 35, left: 10, bottom: 5 }}>
              <XAxis
                type="number"
                domain={[0, "dataMax + 1"]}
                tick={{ fontSize: 11, fill: "#71717a", fontFamily: "monospace" }}
                axisLine={{ stroke: "#e4e4e7" }}
                tickLine={{ stroke: "#e4e4e7" }}
              />
              <YAxis
                type="category"
                dataKey="bundleLabel"
                width={160}
                tick={{ fontSize: 11, fill: "#18181b", fontWeight: 600 }}
                axisLine={{ stroke: "#e4e4e7" }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f4f4f5" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as (typeof chartData)[number];
                    return (
                      <div className="bg-neutral-950 text-white text-xs p-3 rounded-lg shadow-lg border border-neutral-800 max-w-xs">
                        <div className="font-semibold text-neutral-100">{item.bundleLabel}</div>
                        <div className="font-mono font-bold mt-1" style={{ color: accentHex }}>
                          {item.jobsPer10Hours.toFixed(1)} {t.jobsPer10HoursLabel || "jobs / 10h training"}
                        </div>
                        <div className="text-neutral-300 text-[11px] mt-1">
                          {t.unlocksOpportunities || "Unlocks"} {item.jobsUnlocked} · {item.totalLearnHours}h total
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="jobsPer10Hours" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`bundle-cell-${entry.bundleLabel}-${index}`} fill={index === 0 ? accentHex : "#27272a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-3 mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: accentHex }} />
          Highest ROI Pathway
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: "#27272a" }} />
          Secondary Pathways
        </span>
      </div>
    </div>
  );
};
