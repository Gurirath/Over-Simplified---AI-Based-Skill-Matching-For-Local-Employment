"use client";

import React, { createContext, useContext } from "react";

/**
 * Simplified theme context. REACH is monochrome with exactly one accent
 * colour, used sparingly (CLAUDE.md §7). Dark mode and the original Vite
 * UI's 5-preset accent switcher are cut (CLAUDE.md §9 item 7, not lifted
 * by the i18n carve-out in §16) — this replaces that system with one fixed
 * value so components that read useTheme() for accentHex/resolvedMode
 * don't each need a bespoke rewrite. There is no ThemeSelector — the accent
 * and mode are fixed, not user-configurable.
 */

export const ACCENT_HEX = "#2563eb";

interface ThemeContextType {
  accentHex: string;
  resolvedMode: "light";
}

const FIXED_THEME: ThemeContextType = { accentHex: ACCENT_HEX, resolvedMode: "light" };

const ThemeContext = createContext<ThemeContextType>(FIXED_THEME);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeContext.Provider value={FIXED_THEME}>{children}</ThemeContext.Provider>
);

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
