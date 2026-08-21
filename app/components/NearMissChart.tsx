import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import type { NearMissBucket } from "@/lib/optimizer";

interface NearMissChartProps {
  data: NearMissBucket[];
  language?: LanguageCode;
}

const BUCKET_CATEGORY: Record<NearMissBucket["bucket"], string> = {
  "1_skill": "1 skill away",
  "2_skills": "2 skills away",
  "3_plus_skills": "3+ skills away",
};

const BUCKET_LABEL: Record<NearMissBucket["bucket"], string> = {
  "1_skill": "Single skill gap to reach full qualification",
  "2_skills": "Two skill gaps to bridge",
  "3_plus_skills": "Three or more skill gaps to bridge",
};

export const NearMissChart: React.FC<NearMissChartProps> = ({ data, language = "en" }) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const localizedData = (data || []).map((d) => {
    const category =
      d.bucket === "1_skill"
        ? t.skillsAway1 || BUCKET_CATEGORY[d.bucket]
        : d.bucket === "2_skills"
          ? t.skillsAway2 || BUCKET_CATEGORY[d.bucket]
          : t.skillsAway3Plus || BUCKET_CATEGORY[d.bucket];
    const label =
      d.bucket === "1_skill"
        ? t.skillsAway1Label || BUCKET_LABEL[d.bucket]
        : d.bucket === "2_skills"
          ? t.skillsAway2Label || BUCKET_LABEL[d.bucket]
          : t.skillsAway3PlusLabel || BUCKET_LABEL[d.bucket];
    return { bucket: d.bucket, count: d.jobIds.length, category, label };
  });

  const total = localizedData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div
      id="chart-near-miss"
      className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-950 tracking-tight">
            {t.skillsNeededTitle || "Skills Gap to Qualification"}
          </h2>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded border border-neutral-200 uppercase tracking-wider">
            {t.qualificationDeltaBadge || "Qualification Delta"}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {t.skillsNeededDesc || "Feasible local opportunities categorized by count of additional skills required"}
        </p>
      </div>

      <div className="h-56 sm:h-64 w-full mt-4">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-neutral-500 italic">
            {t.noFeasibleFound || "No feasible opportunities available."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={localizedData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
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
                dataKey="category"
                width={120}
                tick={{ fontSize: 11, fill: "#18181b", fontWeight: 600 }}
                axisLine={{ stroke: "#e4e4e7" }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f4f4f5" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as (typeof localizedData)[number];
                    return (
                      <div className="bg-neutral-950 text-white text-xs p-3 rounded-lg shadow-lg border border-neutral-800">
                        <div className="font-semibold text-neutral-100">{item.category}</div>
                        <div className="font-mono font-bold mt-1" style={{ color: accentHex }}>
                          {item.count} {t.opportunitiesCount || "opportunities"}
                        </div>
                        <div className="text-neutral-300 text-[11px] mt-1 leading-normal">{item.label}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {localizedData.map((entry, index) => (
                  <Cell
                    key={`nearmiss-cell-${entry.bucket}-${index}`}
                    fill={entry.bucket === "1_skill" ? accentHex : "#3f3f46"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-3 mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: accentHex }} />
          {t.skillsAway1 || "1 skill away"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: "#3f3f46" }} />
          {t.skillsAway2 || "2+ skills away"}
        </span>
      </div>
    </div>
  );
};
