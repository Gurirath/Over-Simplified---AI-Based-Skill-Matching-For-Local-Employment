"use client";

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import { estimateIsochroneRadiusKm } from "./adapters";
import { employerTypeLabel } from "./employerTypeMap";
import { bestCommute } from "@/lib/commute";
import type { Candidate, Employer, Job } from "@/lib/types";

interface EmployerMapProps {
  candidate: Candidate;
  employers: Employer[];
  jobs: Job[];
  language?: LanguageCode;
}

const createCandidateIcon = (accentColor: string) =>
  L.divIcon({
    className: "custom-map-icon",
    html: `<div style="width:28px;height:28px;background:#09090b;border:2.5px solid #ffffff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:${accentColor};border-radius:50%;"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const createEmployerIcon = (inReach: boolean) => {
  const bg = inReach ? "#18181b" : "#a1a1aa";
  const opacity = inReach ? "1" : "0.6";
  return L.divIcon({
    className: "custom-map-icon",
    html: `<div style="width:24px;height:24px;background:${bg};border:2px solid #ffffff;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.2);opacity:${opacity};"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createJobIcon = (inReach: boolean, accentColor: string) => {
  const bg = inReach ? accentColor : "#71717a";
  const opacity = inReach ? "1" : "0.55";
  return L.divIcon({
    className: "custom-map-icon",
    html: `<div style="width:22px;height:22px;background:${bg};border:2px solid #ffffff;transform:rotate(45deg);box-shadow:0 2px 6px rgba(0,0,0,0.25);opacity:${opacity};"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

export const EmployerMap: React.FC<EmployerMapProps> = ({ candidate, employers, jobs, language = "en" }) => {
  const { accentHex } = useTheme();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [showEmployers, setShowEmployers] = useState(true);
  const [showJobs, setShowJobs] = useState(true);
  const [showReachCircle, setShowReachCircle] = useState(true);

  const center: [number, number] = [candidate.location.lat, candidate.location.lng];
  const radiusKm = estimateIsochroneRadiusKm(candidate);

  return (
    <div id="geographic-map-view" className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: accentHex }} />
            <h2 className="text-sm font-bold text-neutral-950 tracking-tight">{t.mapTitle || "Spatial Commute Reach"}</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">{t.mapSubtitle || "Business locations vs job vacancies"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start text-xs font-mono">
          <button
            type="button"
            onClick={() => setShowEmployers(!showEmployers)}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
              showEmployers ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs" : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            {t.filterFacilities || "Facilities"} ({employers.length})
          </button>
          <button
            type="button"
            onClick={() => setShowJobs(!showJobs)}
            className="px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: showJobs ? accentHex : "#fff",
              borderColor: showJobs ? accentHex : "#d4d4d8",
              color: showJobs ? "#fff" : "#525252",
            }}
          >
            {t.filterVacancies || "Job Vacancies"} ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setShowReachCircle(!showReachCircle)}
            className="px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors"
            style={
              showReachCircle
                ? { backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }
                : undefined
            }
          >
            {t.filterReachBoundary || "Reach Boundary"} (~{radiusKm.toFixed(1)} km)
          </button>
        </div>
      </div>

      <div className="p-3 bg-neutral-50/70 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>
          <strong>{t.civicTaxonomyNotice ? "" : "Estimate:"}</strong>{" "}
          {t.mapCachedNotice || "Estimated reach — not a routed boundary."} Radius is derived from your fastest available
          transport mode and your {candidate.constraints.maxCommuteMinutes}-minute commute ceiling, not real routing.
        </span>
        <span className="font-mono text-neutral-700 font-medium shrink-0">
          {t.radiusLabel || "Radius"}: ~{radiusKm.toFixed(1)} km (estimate)
        </span>
      </div>

      <div className="h-80 sm:h-96 w-full rounded-lg border border-neutral-300 overflow-hidden relative shadow-2xs">
        <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showReachCircle && (
            <Circle
              center={center}
              radius={radiusKm * 1000}
              pathOptions={{ color: accentHex, fillColor: accentHex, fillOpacity: 0.1, weight: 1.5, dashArray: "5, 5" }}
            />
          )}

          <Marker position={center} icon={createCandidateIcon(accentHex)}>
            <Popup>
              <div className="p-1 text-xs">
                <div className="font-bold text-neutral-900">{t.candidateLocationTitle || "Your location"}</div>
                <div className="font-mono text-[11px] mt-1 font-semibold" style={{ color: accentHex }}>
                  ~{radiusKm.toFixed(1)} km estimated reach ({candidate.constraints.maxCommuteMinutes} min ceiling)
                </div>
              </div>
            </Popup>
          </Marker>

          {showEmployers &&
            employers.map((emp) => {
              const commute = bestCommute(candidate.location, { lat: emp.lat, lng: emp.lng }, candidate.constraints.availableModes);
              const inReach = commute !== null && commute.minutes <= candidate.constraints.maxCommuteMinutes;
              return (
                <Marker key={emp.id} position={[emp.lat, emp.lng]} icon={createEmployerIcon(inReach)}>
                  <Popup>
                    <div className="p-1 text-xs space-y-1 max-w-[200px]">
                      <div className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-semibold tracking-wider uppercase border border-neutral-300">
                        Business location
                      </div>
                      <div className="font-bold text-neutral-950 text-xs leading-tight">{emp.name}</div>
                      <div className="text-neutral-500 text-[11px]">{employerTypeLabel(emp.employerType)}</div>
                      <div className="text-[10px] text-neutral-400 italic pt-0.5">*Registered facility, not an active vacancy.</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {showJobs &&
            jobs.map((job) => {
              const commute = bestCommute(candidate.location, job.location, candidate.constraints.availableModes);
              const inReach = commute !== null && commute.minutes <= candidate.constraints.maxCommuteMinutes;
              return (
                <Marker key={job.id} position={[job.location.lat, job.location.lng]} icon={createJobIcon(inReach, accentHex)}>
                  <Popup>
                    <div className="p-1 text-xs space-y-1 max-w-[220px]">
                      <div
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border"
                        style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
                      >
                        Job vacancy
                      </div>
                      <div className="font-bold text-neutral-950 text-xs leading-tight">{job.title}</div>
                      <div className="text-neutral-600 text-[11px]">{job.employerName}</div>
                      <div className="text-neutral-700 font-mono text-[11px]">
                        Rs{job.salaryMin.toLocaleString("en-IN")}–{job.salaryMax.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 pt-1 text-xs text-neutral-600 font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-neutral-900 border-2 border-white flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentHex }} />
            </span>
            Your location
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-neutral-900" />
            Business facility (in reach)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-neutral-400 opacity-60" />
            Facility (outside reach)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: accentHex }} />
            Job vacancy
          </span>
        </div>
        <div className="text-neutral-400 text-[11px]">Reach circle is an estimate, not routed navigation.</div>
      </div>
    </div>
  );
};
