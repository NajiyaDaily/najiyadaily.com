// ── NajiyaDaily Content Ingestion — No API Key Required ──────────
// Uses Blogger's public JSON feed exclusively
// No Google Cloud setup, no API keys, no authentication
// Works immediately with any public Blogger blog

import type { BloggerPost, PaginatedPosts } from "@/types";

const BLOG_ID   = "6392874604663604321";
const FEED_BASE = "https://najiya-daily.blogspot.com/feeds/posts/default";

// ── Helpers ──────────────────────────────────────────────────────

export function urlToSlug(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+\/\d{4}\/\d{2}\//, "")
    .replace(/\.html$/, "");
}

export function extractFeaturedImage(content: string): string | null {
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (!m) return null;
  // Upgrade Blogger thumbnail size
  return m[1]
    .replace(/\/s\d+-c\//, "/s800-c/")
    .replace(/\/s\d+\//, "/s800/");
}

export function extractSnippet(content: string, max = 220): string {
  const clean = content
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

export function calcReadTime(content: string) {
  const text      = content.replace(/<[^>]+>/g, " ");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return { wordCount, readTime: Math.max(1, Math.ceil(wordCount / 200)) };
}

// ── Normalise a raw feed entry ───────────────────────────────────
function normaliseEntry(e: Record<string, unknown>): BloggerPost {
  const links   = (e.link as Array<{ rel: string; href: string }>) ?? [];
  const altLink = links.find((l) => l.rel === "alternate")?.href ?? "";
  const content = ((e.content  as Record<string,unknown>)?.$t as string)
               ?? ((e.summary  as Record<string,unknown>)?.$t as string) ?? "";
  const { wordCount, readTime } = calcReadTime(content);
  const labels  = ((e.category as Array<{ term: string }>) ?? []).map((c) => c.term);
  // Blogger thumbnail — upgrade to 800px
  const thumb   = (e["media$thumbnail"] as Record<string,unknown>)?.url as string | undefined;
  const img     = thumb
    ? thumb.replace(/\/s\d+-c\//, "/s800-c/").replace(/\/s\d+\//, "/s800/")
    : extractFeaturedImage(content);

  return {
    id:           ((e.id as Record<string,unknown>)?.$t as string) ?? "",
    title:        ((e.title as Record<string,unknown>)?.$t as string) ?? "",
    content,
    url:          altLink,
    slug:         urlToSlug(altLink),
    published:    ((e.published as Record<string,unknown>)?.$t as string) ?? "",
    updated:      ((e.updated   as Record<string,unknown>)?.$t as string) ?? "",
    labels,
    author:       ((((e.author as Record<string,unknown>[])?.[0] as Record<string,unknown>)
                    ?.["name"] as Record<string,unknown>)?.$t as string) ?? "NajiyaDaily",
    featuredImage: img,
    snippet:      extractSnippet(content),
    wordCount,
    readTime,
  };
}

// ── Core fetch — public JSON feed ────────────────────────────────
async function fetchFeed(opts: {
  label?:      string;
  maxResults?: number;
  startIndex?: number;
  orderBy?:    "published" | "updated";
  q?:          string;
}): Promise<{ posts: BloggerPost[]; total: number }> {
  const params = new URLSearchParams({
    alt:          "json",
    "max-results": String(opts.maxResults ?? 10),
    "start-index": String(opts.startIndex ?? 1),
    orderby:       opts.orderBy === "updated" ? "updated" : "published",
  });
  if (opts.q) params.set("q", opts.q);

  const baseUrl = opts.label
    ? `${FEED_BASE}/-/${encodeURIComponent(opts.label)}`
    : FEED_BASE;

  const res = await fetch(`${baseUrl}?${params}`, {
    next: { revalidate: 300 },  // 5-min ISR cache
  });

  if (!res.ok) {
    console.error(`Feed fetch error: ${res.status} ${res.statusText}`);
    return { posts: [], total: 0 };
  }

  const data = await res.json() as {
    feed?: {
      entry?:              Record<string,unknown>[];
      "openSearch$totalResults"?: Record<string,unknown>;
    }
  };

  const entries = data.feed?.entry ?? [];
  const total   = parseInt(
    String((data.feed?.["openSearch$totalResults"] as Record<string,unknown>)?.$t ?? "0"),
    10
  );

  return { posts: entries.map(normaliseEntry), total };
}

// ── Public API ───────────────────────────────────────────────────

export async function getPosts(opts: {
  label?:      string;
  maxResults?:  number;
  pageIndex?:   number;
  orderBy?:     "published" | "updated";
} = {}): Promise<PaginatedPosts> {
  const maxResults  = opts.maxResults ?? 10;
  const startIndex  = ((opts.pageIndex ?? 0) * maxResults) + 1;
  const { posts, total } = await fetchFeed({
    label:      opts.label,
    maxResults,
    startIndex,
    orderBy:    opts.orderBy ?? "published",
  });
  return {
    posts,
    nextToken: posts.length === maxResults ? String(startIndex + maxResults) : null,
    total,
  };
}

export async function getPost(slug: string): Promise<BloggerPost | null> {
  // Blogger feed doesn't support lookup by slug directly
  // Search by slug keywords and find exact match
  const keywords = slug.replace(/-/g, " ").split(" ").slice(0, 4).join(" ");
  const { posts } = await fetchFeed({ q: keywords, maxResults: 10 });
  const exact = posts.find(
    (p) => p.slug === slug || p.url.includes(slug)
  );
  if (exact) return exact;
  // Broader fallback — return first result
  return posts[0] ?? null;
}

export async function searchPosts(query: string): Promise<BloggerPost[]> {
  const { posts } = await fetchFeed({ q: query, maxResults: 20 });
  return posts;
}

export async function getPostsByLabel(
  label: string, max = 10
): Promise<BloggerPost[]> {
  const { posts } = await fetchFeed({ label, maxResults: max });
  return posts;
}
