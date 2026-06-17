import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
