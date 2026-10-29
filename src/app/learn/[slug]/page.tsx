import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonRoute } from "@/components/lesson/lesson-route";
import { isSlug, LESSONS, lessonBySlug } from "@/content/meta";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata(props: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  if (!isSlug(slug)) return {};
  const meta = lessonBySlug(slug);
  return { title: meta.title, description: meta.tagline };
}

export default function LessonPage(props: PageProps<"/learn/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Lesson params={props.params} />
    </Suspense>
  );
}

async function Lesson({ params }: Pick<PageProps<"/learn/[slug]">, "params">) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  return <LessonRoute slug={slug} />;
}
