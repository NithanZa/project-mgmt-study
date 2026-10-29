import type { ReactNode } from "react";
import { CourseMap } from "@/components/site/course-map";
import { LESSONS } from "@/content/meta";
import { THUMBNAILS } from "@/content/thumbnails";
import type { Slug } from "@/content/types";

export default function Home() {
  const thumbnails = {} as Record<Slug, ReactNode>;
  for (const { slug } of LESSONS) {
    const Thumbnail = THUMBNAILS[slug];
    thumbnails[slug] = <Thumbnail />;
  }
  return <CourseMap thumbnails={thumbnails} />;
}
