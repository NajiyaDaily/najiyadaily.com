// ── SEO Utilities ────────────────────────────────────────────────
import type { BloggerPost } from "@/types";

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.najiyadaily.com";
const SITE_NAME = "NajiyaDaily";
const SITE_DESC = "Real news, travel guides, gadget reviews and Daily Paws — published daily from Sri Lanka.";

export function buildPostMeta(post: BloggerPost) {
  const title = `${post.title} | ${SITE_NAME}`;
  const desc  = post.snippet.slice(0, 160);
  const url   = `${SITE_URL}/posts/${post.slug}`;
  const img   = post.featuredImage ?? `${SITE_URL}/og-default.jpg`;
  return { title, desc, url, img };
}

export function buildArticleJsonLd(post: BloggerPost) {
  const { url, img } = buildPostMeta(post);
  return {
    "@context": "https://schema.org",
    "@type": post.labels.includes("Review") ? "Review" : "NewsArticle",
    headline:        post.title,
    description:     post.snippet,
    url,
    datePublished:   post.published,
    dateModified:    post.updated,
    author: {
      "@type": "Organization",
      name:    SITE_NAME,
      url:     SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name:    SITE_NAME,
      url:     SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    image: { "@type": "ImageObject", url: img },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name:     item.name,
      item:     item.url,
    })),
  };
}

export function buildSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name:        SITE_NAME,
    url:         SITE_URL,
    description: SITE_DESC,
    foundingLocation: { "@type": "Place", name: "Sri Lanka" },
    sameAs: [],
    potentialAction: {
      "@type": "SearchAction",
      target:  `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
