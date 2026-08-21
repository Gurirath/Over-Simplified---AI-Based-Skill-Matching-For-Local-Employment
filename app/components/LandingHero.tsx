import React from "react";
import { LanguageSelector } from "./LanguageSelector";
import { TRANSLATIONS, type LanguageCode } from "./i18n";
import { useTheme } from "./ThemeContext";
import { ArrowRight, Compass, Building2, HardDriveDownload, CheckCircle2 } from "lucide-react";

interface LandingHeroProps {
  onSelectCandidate: () => void;
  onSelectEmployer: () => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSelectCandidate,
  onSelectEmployer,
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];
  const { accentHex } = useTheme();

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      <header className="border-b border-neutral-200/90 bg-white/90 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white font-bold tracking-tight text-sm shadow-xs">
              R
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-neutral-950">{t.appName}</span>
              <span className="ml-2 text-xs text-neutral-500 hidden sm:inline-block font-normal border-l border-neutral-200 pl-2">
                {t.civicPlatform}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-600 bg-neutral-100/90 px-2.5 py-1.5 rounded-md border border-neutral-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px]">{t.offlineStatus}</span>
            </div>
            <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono border self-start shadow-2xs"
              style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentHex }} />
              <span className="font-semibold tracking-wide uppercase">Local Feasibility Gateway</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-[2.85rem] font-extrabold tracking-tight text-neutral-950 leading-[1.12]">
                {t.appTagline}
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl font-normal">{t.taglineSub}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-neutral-200/90 text-xs text-neutral-700 font-mono space-y-2 shadow-xs">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-sans font-semibold">
                Deterministic Reach Assessment Model
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-neutral-800 text-xs font-medium">
                <span className="px-2 py-0.5 bg-neutral-100 rounded border border-neutral-200">Skills</span>
                <span className="text-neutral-400">+</span>
                <span className="px-2 py-0.5 bg-neutral-100 rounded border border-neutral-200">Location</span>
                <span className="text-neutral-400">+</span>
                <span className="px-2 py-0.5 bg-neutral-100 rounded border border-neutral-200">Commute</span>
                <span className="text-neutral-400">+</span>
                <span className="px-2 py-0.5 bg-neutral-100 rounded border border-neutral-200">Hours</span>
                <span className="text-neutral-400">→</span>
                <span
                  className="px-2 py-0.5 font-bold rounded border shadow-2xs"
                  style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent-fg)" }}
                >
                  Feasible Opportunities
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3.5">
              <button
                id="btn-continue-candidate"
                type="button"
                onClick={onSelectCandidate}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-neutral-950 text-white font-medium text-sm rounded-lg shadow-xs hover:bg-neutral-800 transition-all cursor-pointer group"
              >
                <Compass className="w-4 h-4 text-neutral-400 transition-transform group-hover:rotate-45" />
                <span>{t.continueCandidate}</span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                id="btn-continue-employer"
                type="button"
                onClick={onSelectEmployer}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-neutral-900 font-medium text-sm rounded-lg border border-neutral-300 shadow-xs hover:bg-neutral-50 transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-neutral-600" />
                <span>{t.continueEmployer}</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-neutral-600 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800" />
                No registration required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800" />
                Low-bandwidth cached
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800" />
                Deterministic spatial scoring
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full bg-white border border-neutral-200/90 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col items-center gap-6">
              <div className="w-full flex items-center justify-between text-xs text-neutral-500 font-mono pb-3 border-b border-neutral-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs inline-block" style={{ backgroundColor: accentHex }} />
                  <span className="font-semibold text-neutral-800">LOCAL CORPUS</span>
                </span>
                <span className="text-[10px] uppercase text-neutral-400">Synthetic, Vellore/Katpadi</span>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full">
                <div>
                  <div className="text-4xl font-extrabold font-mono text-neutral-950">250</div>
                  <div className="text-[11px] text-neutral-500 font-mono mt-1">synthetic jobs</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold font-mono text-neutral-950">113</div>
                  <div className="text-[11px] text-neutral-500 font-mono mt-1">skill taxonomy</div>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-neutral-100 text-xs text-neutral-600 leading-relaxed">
                Every match traces to a set operation — an exact optimizer, not a heuristic, computes the
                minimum-effort skill acquisition that maximally expands your reachable jobs.
              </div>

              <div className="w-full pt-3 border-t border-neutral-100 text-center text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">Experience → Skills → Opportunity → Reach</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-4 text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reach Civic Technology Core • Offline-Ready Regional Architecture</span>
          </div>
          <div>Pure server-side scoring • Zero tracking cookies</div>
        </div>
      </footer>
    </div>
  );
};
