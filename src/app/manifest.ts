import type { MetadataRoute } from "next";

// Web app manifest — makes Momentum installable (home screen / desktop) and,
// on iOS, is a prerequisite for web push once added to the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Momentum — Accountability & Habit Tracking",
    short_name: "Momentum",
    description:
      "Track progress together, stay accountable, and build better habits with your group.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#050a08",
    theme_color: "#050a08",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
