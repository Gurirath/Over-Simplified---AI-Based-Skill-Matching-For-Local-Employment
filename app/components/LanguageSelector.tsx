import React from "react";
import { Globe } from "lucide-react";
import type { LanguageCode } from "./i18n";

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

const LANGUAGES: { code: LanguageCode; label: string; nativeName: string }[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "es", label: "Spanish", nativeName: "Español" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "fr", label: "French", nativeName: "Français" },
  { code: "sw", label: "Swahili", nativeName: "Kiswahili" },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-white border border-neutral-200 rounded-md px-2 py-1 shadow-xs">
      <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
        className="bg-transparent text-neutral-800 font-medium focus:outline-none cursor-pointer pr-1"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
};
