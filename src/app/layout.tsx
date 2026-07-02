import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { ThemedToaster } from "@/components/themed-toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Momentum — Accountability & Habit Tracking",
  description:
    "Track progress together, stay accountable, and achieve your goals with friends. The social platform for building better habits.",
  keywords: [
    "accountability",
    "habit tracker",
    "goal tracking",
    "social productivity",
    "study group",
    "fitness accountability",
  ],
  appleWebApp: {
    capable: true,
    title: "Momentum",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#050a08",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved/system theme before first paint (no flash) */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
