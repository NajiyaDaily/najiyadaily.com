import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.najiyadaily.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "published")
    .limit(500);

  const postUrls = (posts || []).map((p) => ({
    url:             `${SITE_URL}/posts/${p.slug}`,
    lastModified:    new Date(p.updated_at),
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }));

  return [
    { url: SITE_URL,                      lastModified: new Date(), changeFrequency: "hourly" as const, priority: 1 },
    { url: `${SITE_URL}/category/world`,  lastModified: new Date(), changeFrequency: "daily"  as const, priority: 0.7 },
    { url: `${SITE_URL}/category/travel`, lastModified: new Date(), changeFrequency: "daily"  as const, priority: 0.7 },
    ...postUrls,
  ];
}
