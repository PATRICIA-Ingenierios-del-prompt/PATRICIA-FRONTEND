import { createContext, useContext } from 'react';

export interface ThemeColors {
  darkMode: boolean;
  // Backgrounds
  bg: string;
  cardBg: string;
  cardBorder: string;
  sidebarBg: string;
  inputBg: string;
  inputBorder: string;
  hoverBg: string;
  activeBg: string;
  // Text
  text: string;
  textMuted: string;
  textSub: string;
  // Accents (same in both themes)
  primary: string;
  accent: string;
  // Utility
  divider: string;
  shadow: string;
}

const darkTheme: ThemeColors = {
  darkMode: true,
  bg: '#0D0B1E',
  cardBg: 'rgba(26,24,41,0.95)',
  cardBorder: 'rgba(108,99,255,0.18)',
  sidebarBg: 'rgba(13,11,30,0.92)',
  inputBg: 'rgba(108,99,255,0.08)',
  inputBorder: 'rgba(108,99,255,0.25)',
  hoverBg: 'rgba(108,99,255,0.08)',
  activeBg: 'rgba(108,99,255,0.18)',
  text: '#F0EEFF',
  textMuted: '#8B85B0',
  textSub: '#C0BAE0',
  primary: '#6C63FF',
  accent: '#7FE7C4',
  divider: 'rgba(108,99,255,0.15)',
  shadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const lightTheme: ThemeColors = {
  darkMode: false,
  bg: '#F4F2FF',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(108,99,255,0.15)',
  sidebarBg: 'rgba(255,255,255,0.98)',
  inputBg: '#F5F3FF',
  inputBorder: 'rgba(108,99,255,0.3)',
  hoverBg: '#EDE9FF',
  activeBg: 'rgba(108,99,255,0.12)',
  text: '#1A1829',
  textMuted: '#5A5480',
  textSub: '#3D3660',
  primary: '#6C63FF',
  accent: '#0D9D74',
  divider: 'rgba(108,99,255,0.12)',
  shadow: '0 4px 24px rgba(108,99,255,0.12)',
};

export const ThemeContext = createContext<ThemeColors>(darkTheme);

export function useTheme() {
  return useContext(ThemeContext);
}

export function getTheme(darkMode: boolean): ThemeColors {
  return darkMode ? darkTheme : lightTheme;
}
