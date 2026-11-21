import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Term } from "@/components/lesson/term";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};

/** The plain text a node renders: tags stripped, whitespace collapsed. */
export function textOf(node: ReactNode): string {
  return renderToStaticMarkup(node)
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|nbsp|#x27|#39);/g, (e) => ENTITIES[e])
    .replace(/\s+/g, " ")
    .trim();
}

/** Words in a node's text; a token counts when it holds a letter or digit. */
export function wordCount(node: ReactNode): number {
  return textOf(node)
    .split(" ")
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** Ids of every `Term` in a node's element tree, in order. */
export function termIds(node: ReactNode): string[] {
  const ids: string[] = [];
  const walk = (n: ReactNode) => {
    Children.forEach(n, (child) => {
      if (!isValidElement<{ id?: unknown; children?: ReactNode }>(child)) return;
      if (child.type === Term) ids.push(String(child.props.id ?? ""));
      walk(child.props.children);
    });
  };
  walk(node);
  return ids;
}
