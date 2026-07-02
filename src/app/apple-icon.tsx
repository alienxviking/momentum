import { ImageResponse } from "next/og";

// iOS home-screen icon. iOS applies its own rounded mask, so we go full-bleed.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// "Ascent" mark — rising chevrons, emerald→cyan. Rendered from a data-URI SVG so
// the gradient + strokes rasterize cleanly through next/og (Satori + resvg).
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 32 32"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="16" y1="7" x2="16" y2="25"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><g fill="none" stroke="url(#g)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14 L16 7 L24 14"/><path d="M8 25 L16 18 L24 25"/></g></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050a08",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={120}
          height={120}
          src={`data:image/svg+xml;utf8,${encodeURIComponent(mark)}`}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
