// Content Layer — reads Markdown files from /content/
import fs   from "fs";
import path from "path";
import type { ArticleRow } from "./supabase";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface ParsedArticle extends ArticleRow {
  body: string;
}

export function readArticleFile(category: string, slug: string): string | null {
  const filePath = path.join(CONTENT_DIR, category.toLowerCase().replace("-",""), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("---", 3);
  if (end < 0) return { meta: {}, body: raw };
  const fm   = raw.slice(3, end).trim();
  const body = raw.slice(end + 3).trim();
  const meta: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const sep = line.indexOf(":");
    if (sep < 0) continue;
    meta[line.slice(0, sep).trim()] = line.slice(sep + 1).trim().replace(/^["\']/,"").replace(/["\']+$/,"");
  }
  return { meta, body };
}

export function buildMarkdownFile(data: {
  title: string; standfirst: string; category: string;
  labels: string[]; slug: string; featured_image: string;
  image_credit: string; explains: string; why_matters: string;
  takeaways: string[]; whats_next: string[]; body: string; published_at: string;
}): string {
  const fm = [
    "---",
    `title: "${data.title.replace(/"/g, '\\"')}"`,
    `standfirst: "${data.standfirst.replace(/"/g, '\\"')}"`,
    `category: "${data.category}"`,
    `labels: [${data.labels.map((l) => `"${l}"`).join(", ")}]`,
    `slug: "${data.slug}"`,
    `featured_image: "${data.featured_image}"`,
    `image_credit: "${data.image_credit}"`,
    `published_at: "${data.published_at}"`,
    `explains: "${data.explains.replace(/"/g, '\\"').slice(0, 300)}"`,
    `why_matters: "${data.why_matters.replace(/"/g, '\\"').slice(0, 200)}"`,
    `takeaways:`,
    ...data.takeaways.map((t) => `  - "${t.replace(/"/g, '\\"')}"`),
    `whats_next:`,
    ...data.whats_next.map((w) => `  - "${w.replace(/"/g, '\\"')}"`),
    "---",
  ].join("\n");
  return `${fm}\n\n${data.body}`;
}
