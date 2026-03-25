import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { themes, type ThemeMode, type ResolvedTheme, type ThemeTokens } from './tokens';

interface ThemeContextValue {
  /** Current theme tokens (colors, spacing, typography, etc.) */
  theme: ThemeTokens;
  /** User's selected mode (may be 'system') */
  mode: ThemeMode;
  /** Resolved mode after evaluating OS preference */
  resolvedMode: ResolvedTheme;
  /** Change the theme mode */
  setTheme: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.darkMatte,
  mode: 'system',
  resolvedMode: 'darkMatte',
  setTheme: () => {},
});

/**
 * Resolves 'system' to a concrete theme. OS dark → darkMatte, OS light → light.
 * All other modes pass through directly.
 */
function resolveMode(mode: ThemeMode, osScheme: 'light' | 'dark' | null | undefined): ResolvedTheme {
  if (mode !== 'system') return mode;
  return osScheme === 'light' ? 'light' : 'darkMatte';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const osScheme = useColorScheme();

  const resolvedMode = resolveMode(mode, osScheme);
  const theme = useMemo(() => themes[resolvedMode], [resolvedMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, resolvedMode, setTheme }),
    [theme, mode, resolvedMode, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
