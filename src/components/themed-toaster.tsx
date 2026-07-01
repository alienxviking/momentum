"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";

/**
 * Sonner toaster that follows the app theme and matches the Momentum design
 * tokens (glass surface, emerald accent).
 */
export function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
          color: "var(--color-text-primary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-elevated)",
        },
      }}
    />
  );
}
