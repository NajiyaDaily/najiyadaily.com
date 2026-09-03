import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blogger";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.najiyadaily.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await getPosts({ maxResults: 500 });
  const postUrls = posts.map((p) => ({
    url:          `${SITE_URL}/posts/${p.slug}`,
    lastModified: new Date(p.updated),
    changeFrequency: "weekly" as const,
    priority:     0.8,
  }));
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/category/world`,     changeFrequency: "daily", priority: 0.7, lastModified: new Date() },
    { url: `${SITE_URL}/category/travel`,    changeFrequency: "daily", priority: 0.7, lastModified: new Date() },
    { url: `${SITE_URL}/category/dailypaws`, changeFrequency: "daily", priority: 0.7, lastModified: new Date() },
    ...postUrls,
  ];
}
