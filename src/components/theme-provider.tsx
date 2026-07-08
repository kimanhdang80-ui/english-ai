'use client';

import * as React from 'react';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

/** Wraps next-themes to provide light/dark/system theming (UI_GUIDELINE §8). */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
