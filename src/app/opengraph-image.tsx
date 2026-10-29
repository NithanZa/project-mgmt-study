import { ImageResponse } from "next/og";
import { CHAPTERS, LESSONS } from "@/content/meta";

export const alt = "PM Methods: thirteen ways to finish sooner, an interactive course";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Light-theme tokens from globals.css.
const C = { bg: "#f9f9f7", fg: "#0b0b0b", muted: "#5c5b57", accent: "#256abf" };

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: C.bg,
          color: C.fg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none" stroke={C.accent} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 16 16 25 27 16" strokeWidth="2.5" opacity=".4" />
              <path d="M5 16 16 7 27 16" strokeWidth="3.5" />
              <circle cx="5" cy="16" r="4" fill={C.accent} stroke="none" />
              <circle cx="16" cy="7" r="4" fill={C.accent} stroke="none" />
              <circle cx="16" cy="25" r="3" fill={C.accent} stroke="none" opacity=".4" />
              <circle cx="27" cy="16" r="4" fill={C.accent} stroke="none" />
            </svg>
            PM Methods
          </div>
          <div style={{ display: "flex", fontSize: 24, color: C.muted }}>
            {LESSONS.length} lessons · {CHAPTERS.length} chapters
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 92, letterSpacing: -3, lineHeight: 1.02, textWrap: "balance" }}>
            Thirteen ways to finish sooner.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: C.muted, lineHeight: 1.3 }}>
            Each method is one idea, one interactive model, about ten minutes.
          </div>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          {CHAPTERS.map((chapter) => {
            const count = LESSONS.filter((l) => l.chapter === chapter.id).length;
            return (
              <div key={chapter.id} style={{ display: "flex", flexDirection: "column", gap: 12, flexGrow: count, flexBasis: 0 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {Array.from({ length: count }, (_, i) => (
                    <div key={i} style={{ flexGrow: 1, height: 10, borderRadius: 5, background: C.accent }} />
                  ))}
                </div>
                <div style={{ display: "flex", fontSize: 20, color: C.muted }}>{chapter.numeral}</div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    size,
  );
}
