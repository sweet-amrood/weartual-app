export type Theme = {
  bg: string;
  bgGradientMid: string;
  bgGradientEnd: string;
  bgElevated: string;
  bgInput: string;
  border: string;
  text: string;
  textSecondary: string;
  muted: string;
  muted2: string;
  placeholder: string;
  gold: string;
  goldDeep: string;
  accentBlue: string;
  accentViolet: string;
  danger: string;
  dangerBg: string;
  success: string;
  chipBg: string;
  tabBar: string;
};

export const lightTheme: Theme = {
  bg: "#f8fafc",
  bgGradientMid: "#f1f5f9",
  bgGradientEnd: "#eef2ff",
  bgElevated: "#ffffff",
  bgInput: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textSecondary: "#334155",
  muted: "#64748b",
  muted2: "#94a3b8",
  placeholder: "#94a3b8",
  gold: "#4f46e5",
  goldDeep: "#4338ca",
  accentBlue: "#6366f1",
  accentViolet: "#7c3aed",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  success: "#16a34a",
  chipBg: "#f1f5f9",
  tabBar: "#fffffffa",
};

export const darkTheme: Theme = {
  bg: "#0f172a",
  bgGradientMid: "#1e293b",
  bgGradientEnd: "#0f172a",
  bgElevated: "#1e293b",
  bgInput: "#1e293b",
  border: "#334155",
  text: "#f8fafc",
  textSecondary: "#cbd5e1",
  muted: "#94a3b8",
  muted2: "#64748b",
  placeholder: "#64748b",
  gold: "#6366f1",
  goldDeep: "#4f46e5",
  accentBlue: "#818cf8",
  accentViolet: "#a78bfa",
  danger: "#ef4444",
  dangerBg: "#7f1d1d",
  success: "#22c55e",
  chipBg: "#334155",
  tabBar: "#0f172afa",
};

// Fallback for backwards compatibility if needed before all components are refactored
export const shellTheme = lightTheme;
