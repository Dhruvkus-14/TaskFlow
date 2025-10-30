import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";
/**
 * Project: TaskFlow
 * Author: Dhruv Kushwaha
 * Copyright © 2025
 * This code is for educational showcase only.
 */

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
