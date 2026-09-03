// ── Article Component Parser ─────────────────────────────────────
// Extracts NajiyaDaily signature components from raw HTML content

import type { NajiyaArticle, BloggerPost } from "@/types";

function extractByClass(html: string, className: string): string | null {
  const re = new RegExp(`class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)</(?:div|p|section)>`, "is");
  const m  = html.match(re);
  return m ? m[1].replace(/<[^>]+>/g, " ").trim() : null;
}

function extractList(html: string, containerClass: string): string[] {
  const m = html.match(new RegExp(`class=["'][^"']*${containerClass}[^"']*["'][^>]*>(.*?)</(?:div|ul|ol)>`, "is"));
  if (!m) return [];
  return [...m[1].matchAll(/<li[^>]*>(.*?)<\/li>/gis)].map(
    (li) => li[1].replace(/<[^>]+>/g, " ").trim()
  );
}

function extractPullQuotes(html: string): string[] {
  return [...html.matchAll(/<blockquote[^>]*>(.*?)<\/blockquote>/gis)].map(
    (m) => m[1].replace(/<[^>]+>/g, " ").trim()
  );
}

function extractHeroImageCredit(html: string): string | null {
  const m = html.match(/Photo(?:\s+by)?[:\s]+<a[^>]+>([^<]+)<\/a>/i)
         ?? html.match(/Photo(?:\s+by)?[:\s]+([^<\n]{3,60})/i);
  return m ? m[1].trim() : null;
}

function extractStandfirst(html: string): string | null {
  // Looks for nd-standfirst class OR first <em> paragraph
  const byClass = extractByClass(html, "nd-standfirst");
  if (byClass) return byClass;
  const m = html.match(/<p[^>]*><em[^>]*>(.*?)<\/em><\/p>/is);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : null;
}

export function parseArticle(post: BloggerPost): NajiyaArticle {
  const html = post.content;
  return {
    ...post,
    standfirst:       extractStandfirst(html),
    explains:         extractByClass(html, "nd-explains"),
    whyMatters:       extractByClass(html, "nd-why-matters"),
    takeaways:        extractList(html, "nd-takeaways"),
    whatsNext:        extractList(html, "nd-whats-next"),
    pullQuotes:       extractPullQuotes(html),
    heroImageCredit:  extractHeroImageCredit(html),
    hasAffiliateLinks: html.includes("najiyadaily-20") || html.includes("booking.com"),
    affiliateType:    html.includes("booking.com") ? "booking"
                    : html.includes("najiyadaily-20") ? "amazon"
                    : html.includes("skimlinks") ? "skimlinks"
                    : null,
  };
}
