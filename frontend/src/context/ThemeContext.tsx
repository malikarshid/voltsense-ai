'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'day' | 'dark' | 'eye';

export interface ThemeColors {
  bgMain: string;
  bgSidebar: string;
  bgSurface: string;
  bgSurfaceSecondary: string;
  bgSurfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderColor: string;
  accentPrimary: string;
  accentSecondary: string;
  statusInfo: string;
  statusWarning: string;
  statusCritical: string;
  statusSuccess: string;
  gridColor: string;
  canvasBg: string;
}

export const THEME_COLOR_MAP: Record<ThemeMode, ThemeColors> = {
  day: {
    bgMain: '#FFFFFF',
    bgSidebar: '#FFFFFF',
    bgSurface: '#FFFFFF',
    bgSurfaceSecondary: '#F7F8FA',
    bgSurfaceElevated: '#FFFFFF',
    textPrimary: '#17212B',
    textSecondary: '#687385',
    textMuted: '#8993A1',
    border: '#E5E7EB',
    borderColor: '#E5E7EB',
    accentPrimary: '#247A52',
    accentSecondary: '#526D85',
    statusInfo: '#3978B8',
    statusWarning: '#C58A27',
    statusCritical: '#C44C4C',
    statusSuccess: '#278653',
    gridColor: '#F0F2F5',
    canvasBg: '#FFFFFF',
  },
  dark: {
    bgMain: '#171C22',
    bgSidebar: '#171C22',
    bgSurface: '#202831',
    bgSurfaceSecondary: '#28323C',
    bgSurfaceElevated: '#303B46',
    textPrimary: '#F2F4F6',
    textSecondary: '#A7B0BB',
    textMuted: '#77828F',
    border: '#36414D',
    borderColor: '#36414D',
    accentPrimary: '#83A990',
    accentSecondary: '#7691A8',
    statusInfo: '#7691A8',
    statusWarning: '#C5A56C',
    statusCritical: '#C26767',
    statusSuccess: '#83A990',
    gridColor: '#28323C',
    canvasBg: '#171C22',
  },
  eye: {
    bgMain: '#F3EFE5',
    bgSidebar: '#EAE4D8',
    bgSurface: '#FAF8F1',
    bgSurfaceSecondary: '#EDE8DC',
    bgSurfaceElevated: '#F5F0E4',
    textPrimary: '#343B35',
    textSecondary: '#77786D',
    textMuted: '#949386',
    border: '#DED7C9',
    borderColor: '#DED7C9',
    accentPrimary: '#758B72',
    accentSecondary: '#6D8499',
    statusInfo: '#6D8499',
    statusWarning: '#B08B53',
    statusCritical: '#B16760',
    statusSuccess: '#758B72',
    gridColor: '#E5DFD1',
    canvasBg: '#F3EFE5',
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('day');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage, default to 'day'
    try {
      const savedTheme = localStorage.getItem('voltsense_theme') as ThemeMode | null;
      if (savedTheme && (savedTheme === 'day' || savedTheme === 'dark' || savedTheme === 'eye')) {
        setThemeState(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // First-time users: day mode by default
        setThemeState('day');
        document.documentElement.setAttribute('data-theme', 'day');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // Fallback
      setThemeState('day');
      document.documentElement.setAttribute('data-theme', 'day');
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('voltsense_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  };

  const colors = THEME_COLOR_MAP[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
