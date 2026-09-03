import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPosts } from "@/lib/blogger";
import { getCategoryMeta } from "@/lib/categories";
import { getPrimaryLabel } from "@/lib/categories";

export const revalidate = 300;

const SLUG_MAP: Record<string, string> = {
  world: "World", tech: "Tech", culture: "Culture", science: "Science",
  music: "Music", opinion: "Opinion", travel: "Travel",
  dailypaws: "Daily-Paws", morning: "Morning", afternoon: "Afternoon",
  evening: "Evening", gadgets: "Gadgets",
};

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const label = SLUG_MAP[params.slug] ?? params.slug;
  const meta  = getCategoryMeta(label);
  return {
    title: `${meta.label} — NajiyaDaily`,
    description: `Browse all ${meta.label} articles from NajiyaDaily.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const label   = SLUG_MAP[params.slug] ?? params.slug;
  const meta    = getCategoryMeta(label);
  const { posts } = await getPosts({ label, maxResults: 20 });

  return (
    <div className="max-w-content mx-auto bg-white border-x border-nd-border min-h-screen">
      {/* Category header */}
      <div className="px-5 py-6 border-b-2 border-navy">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ background: meta.color }} />
          <h1 className="font-serif text-[2rem] font-black text-nd-ink">
            {meta.emoji ? `${meta.emoji} ` : ""}{meta.label}
          </h1>
        </div>
        <p className="font-sans text-[13px] text-nd-muted mt-1">
          {posts.length} articles published
        </p>
      </div>

      {/* Article list */}
      <div className="divide-y divide-nd-border2">
        {posts.map((post) => {
          const primary = getPrimaryLabel(post.labels);
          const lm      = getCategoryMeta(primary);
          return (
            <article key={post.id}
              className="group flex gap-4 px-5 py-5 hover:bg-cream transition-colors">
              {post.featuredImage && (
                <Link href={`/posts/${post.slug}`} className="flex-shrink-0">
                  <div className="relative w-[140px] h-[100px] overflow-hidden">
                    <Image src={post.featuredImage} alt={post.title}
                      fill className="object-cover" sizes="140px" unoptimized />
                  </div>
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <span className="nd-badge text-[9px] px-2 py-0.5 mb-2 inline-block"
                      style={{ background: lm.bgColor, color: lm.color }}>
                  {lm.label}
                </span>
                <Link href={`/posts/${post.slug}`}>
                  <h2 className="font-serif text-[1.1rem] font-bold leading-[1.25] text-nd-ink
                                 group-hover:text-navy transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                </Link>
                <p className="font-sans text-[12px] text-nd-muted mt-1.5 line-clamp-2 leading-snug">
                  {post.snippet}
                </p>
                <div className="font-sans text-[10px] text-nd-light mt-2">
                  {new Date(post.published).toLocaleDateString("en-US",
                    { month:"short", day:"numeric", year:"numeric" })} · {post.readTime} min
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
