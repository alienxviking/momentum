import type { NextConfig } from "next";

// Baseline security headers applied to every response.
// Note: a full Content-Security-Policy is intentionally omitted for now — it
// needs a nonce for the inline theme script and an allow-list for Supabase.
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Block MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow embedding the app in frames (clickjacking protection).
  { key: "X-Frame-Options", value: "DENY" },
  // Only send the origin on cross-origin requests.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny access to powerful features the app doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
