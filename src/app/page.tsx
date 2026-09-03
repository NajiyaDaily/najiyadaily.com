import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCategoryMeta, getPrimaryLabel } from "@/lib/categories";
import type { ArticleRow } from "@/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "NajiyaDaily — Stories Worth Your Time",
  description: "Real news, travel guides, gadget reviews and Daily Paws — published daily from Sri Lanka.",
};

function CategoryBadge({ label, size = "sm" }: { label: string; size?: "sm" | "xs" }) {
  const meta = getCategoryMeta(label);
  return (
    <span className={`nd-badge ${size === "xs" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-0.5"}`}
          style={{ background: meta.bgColor, color: meta.color }}>
      {meta.emoji ? `${meta.emoji} ` : ""}{meta.label}
    </span>
  );
}

function HeroCard({ post }: { post: ArticleRow }) {
  const primary = getPrimaryLabel(post.labels);
  return (
    <article className="group">
      <Link href={`/posts/${post.slug}`} className="block mb-4">
        {post.featured_image ? (
          <div className="relative w-full h-[380px] md:h-[440px] overflow-hidden">
            <Image src={post.featured_image} alt={post.title}
              fill priority unoptimized
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"/>
          </div>
        ) : (
          <div className="w-full h-[380px] bg-paper flex items-center justify-center">
            <span className="font-serif text-6xl font-black text-nd-border/30">ND</span>
          </div>
        )}
      </Link>
      <div className="flex gap-2 mb-3 flex-wrap">
        {post.labels.slice(0,2).map((l) => <CategoryBadge key={l} label={l}/>)}
      </div>
      <Link href={`/posts/${post.slug}`}>
        <h2 className="font-serif text-[1.95rem] md:text-[2.2rem] font-black leading-[1.12]
                       text-nd-ink group-hover:text-navy transition-colors mb-3">
          {post.title}
        </h2>
      </Link>
      {post.standfirst && (
        <p className="font-body italic text-nd-ink2 text-[15px] leading-relaxed mb-3 line-clamp-2">
          {post.standfirst}
        </p>
      )}
      <p className="font-body text-nd-muted text-[14px] leading-relaxed line-clamp-2 mb-3">
        {post.excerpt}
      </p>
      <div className="font-sans text-[11px] text-nd-light">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-US",
              { weekday:"short", month:"short", day:"numeric" })
          : ""} · {post.read_time} min read
      </div>
    </article>
  );
}

function RightCard({ post }: { post: ArticleRow }) {
  const primary = getPrimaryLabel(post.labels);
  return (
    <article className="group flex gap-3 py-4 border-b border-nd-border last:border-none">
      <div className="flex-1 min-w-0">
        <CategoryBadge label={primary} size="xs"/>
        <Link href={`/posts/${post.slug}`}>
          <h3 className="font-serif text-[1rem] font-bold leading-[1.25] text-nd-ink
                         group-hover:text-navy transition-colors mt-1.5 line-clamp-3">
            {post.title}
          </h3>
        </Link>
        <div className="font-sans text-[10px] text-nd-light mt-2">
          {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US",
            { month:"short", day:"numeric" }) : ""}
        </div>
      </div>
      {post.featured_image && (
        <Link href={`/posts/${post.slug}`} className="flex-shrink-0">
          <div className="relative w-[110px] h-[85px] overflow-hidden">
            <Image src={post.featured_image} alt={post.title}
              fill className="object-cover" sizes="110px" unoptimized/>
          </div>
        </Link>
      )}
    </article>
  );
}

function GridCard({ post }: { post: ArticleRow }) {
  const primary = getPrimaryLabel(post.labels);
  return (
    <article className="group">
      <Link href={`/posts/${post.slug}`} className="block mb-2">
        {post.featured_image ? (
          <div className="relative w-full h-[145px] overflow-hidden">
            <Image src={post.featured_image} alt={post.title}
              fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width:768px) 50vw, 25vw" unoptimized/>
          </div>
        ) : (
          <div className="w-full h-[145px] bg-paper"/>
        )}
      </Link>
      <CategoryBadge label={primary} size="xs"/>
      <Link href={`/posts/${post.slug}`}>
        <h3 className="font-serif text-[0.95rem] font-bold leading-[1.25] text-nd-ink
                       group-hover:text-navy transition-colors mt-1.5 line-clamp-3">
          {post.title}
        </h3>
      </Link>
      <div className="font-sans text-[10px] text-nd-light mt-1.5">
        {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US",
          { month:"short", day:"numeric" }) : ""} · {post.read_time} min
      </div>
    </article>
  );
}

export default async function HomePage() {
  const { data: posts } = await supabase
    .from("articles")
    .select("*")
    .eq("status","published")
    .order("published_at", { ascending: false })
    .limit(20);

  if (!posts || posts.length === 0) {
    return (
      <div className="max-w-content mx-auto bg-white border-x border-nd-border min-h-screen
                      flex items-center justify-center">
        <div className="text-center py-20">
          <div className="font-serif text-4xl font-black text-nd-border/30 mb-4">ND</div>
          <p className="font-sans text-nd-muted text-sm">First articles coming soon.</p>
        </div>
      </div>
    );
  }

  // Sort: Daily-Paws → Travel → Morning → Afternoon → Evening → others
  const rank = (p: ArticleRow) => {
    if (p.labels.includes("Daily-Paws")) return 0;
    if (p.labels.includes("Travel"))     return 1;
    if (p.labels.includes("Morning"))    return 2;
    if (p.labels.includes("Afternoon"))  return 3;
    if (p.labels.includes("Evening"))    return 4;
    return 5;
  };
  const sorted = [...posts].sort((a,b) => rank(a) - rank(b));

  const hero  = sorted[0];
  const right = sorted.slice(1, 4);
  const grid  = sorted.slice(4, 8);
  const more  = sorted.slice(8, 11);

  return (
    <div className="bg-white border-x border-nd-border max-w-content mx-auto">
      <hr className="border-nd-border"/>

      {/* Main grid — hero left, 3 stacked right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] border-b border-nd-border">
        <div className="p-4 md:p-6 lg:border-r border-nd-border">
          <HeroCard post={hero}/>
        </div>
        <div className="divide-y divide-nd-border2">
          {right.map((p) => <RightCard key={p.id} post={p}/>)}
          {/* Booking widget */}
          <div className="p-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="font-sans text-[9px] font-bold tracking-widest uppercase text-green-700 mb-1">
                ✈ Travel Deals
              </div>
              <div className="font-sans text-[14px] font-bold text-nd-ink mb-1">Find your hotel</div>
              <a href={`https://www.booking.com/?aid=101867344`}
                 target="_blank" rel="noopener sponsored"
                 className="block text-center bg-[#003580] text-white font-sans text-[11px]
                            font-bold uppercase tracking-wide py-2.5 rounded mt-3
                            hover:opacity-90 transition-opacity">
                Search Hotels →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Ad slot */}
      <div className="border-b border-nd-border px-4 py-3 flex items-center justify-center
                      min-h-[90px] bg-paper text-nd-light text-[11px] font-sans tracking-widest uppercase">
        Advertisement
      </div>

      {/* 4-col grid */}
      {grid.length > 0 && (
        <section className="px-4 md:px-6 py-6 border-b border-nd-border">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-5 h-0.5 bg-navy flex-shrink-0"/>
            <span className="font-sans text-[9px] font-bold tracking-[3px] uppercase text-nd-muted">
              More Stories
            </span>
            <div className="flex-1 h-px bg-nd-border"/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {grid.map((p) => <GridCard key={p.id} post={p}/>)}
          </div>
        </section>
      )}

      {/* Extra row */}
      {more.length > 0 && (
        <section className="px-4 md:px-6 py-5 border-b border-nd-border">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-nd-border2">
            {more.map((p) => (
              <article key={p.id} className="group py-4 md:py-0 md:px-5 first:pl-0 last:pr-0">
                <CategoryBadge label={getPrimaryLabel(p.labels)} size="xs"/>
                <Link href={`/posts/${p.slug}`}>
                  <h3 className="font-serif text-[0.95rem] font-bold leading-[1.25] text-nd-ink
                                 group-hover:text-navy transition-colors mt-1.5 line-clamp-3">
                    {p.title}
                  </h3>
                </Link>
                <div className="font-sans text-[10px] text-nd-light mt-2">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString("en-US",
                    { month:"short", day:"numeric" }) : ""}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
