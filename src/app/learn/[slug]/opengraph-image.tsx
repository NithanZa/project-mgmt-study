import { ImageResponse } from "next/og";
import { chapterById, isSlug, LESSONS, lessonBySlug } from "@/content/meta";

export const alt = "PM Methods lesson card with the lesson's number, title, tagline and chapter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

// Light-theme tokens from globals.css.
const C = { bg: "#f9f9f7", fg: "#0b0b0b", muted: "#5c5b57", line: "#e1e0d9", accent: "#256abf" };

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) return new Response("Not found", { status: 404 });
  const lesson = lessonBySlug(slug);
  const chapter = chapterById(lesson.chapter);

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
            Chapter {chapter.numeral} · {chapter.title}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 28, color: C.accent, letterSpacing: 1 }}>
            Lesson {String(lesson.number).padStart(2, "0")}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: lesson.title.length > 28 ? 68 : 84,
              letterSpacing: -2.5,
              lineHeight: 1.04,
              textWrap: "balance",
            }}
          >
            {lesson.title}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: C.muted, lineHeight: 1.3, maxWidth: 980, textWrap: "balance" }}>
            {lesson.tagline}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", flexGrow: 1, gap: 8 }}>
            {LESSONS.map((l) => (
              <div
                key={l.slug}
                style={{ flexGrow: 1, height: 10, borderRadius: 5, background: l.slug === slug ? C.accent : C.line }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", width: 72, fontSize: 22, color: C.muted }}>
            {lesson.number} / {LESSONS.length}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
