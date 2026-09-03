import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { readArticleFile, parseFrontmatter } from "@/lib/content";
import { getCategoryMeta, getPrimaryLabel } from "@/lib/categories";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";
import { FloatingShare } from "@/components/article/FloatingShare";
import { RelatedArticles } from "@/components/article/RelatedArticles";

export const revalidate = 300;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.najiyadaily.com";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  const { data } = await supabase
    .from("articles")
    .select("slug")
    .eq("status","published")
    .limit(100);
  return (data ?? []).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", params.slug)
    .single();
  if (!data) return { title: "Not Found" };
  const url = `${SITE_URL}/posts/${data.slug}`;
  const img = data.featured_image ?? `${SITE_URL}/og-default.jpg`;
  return {
    title: data.title,
    description: data.excerpt ?? data.standfirst ?? "",
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: data.title,
      description: data.excerpt ?? "",
      url, siteName:"NajiyaDaily",
      images:[{ url: img, width:1200, height:630 }],
      publishedTime: data.published_at ?? "",
      tags: data.labels,
    },
    twitter: { card:"summary_large_image", title: data.title,
               description: data.excerpt ?? "", images:[img] },
  };
}

export default async function ArticlePage({ params }: Props) {
  // Fetch metadata from Supabase
  const { data: post } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!post || post.status !== "published") notFound();

  // Fetch body from Markdown file
  const raw  = readArticleFile(post.category, post.slug);
  const body = raw ? parseFrontmatter(raw).body : "<p>Content loading…</p>";

  const primary = getPrimaryLabel(post.labels);
  const meta    = getCategoryMeta(primary);
  const url     = `${SITE_URL}/posts/${post.slug}`;

  const articleJsonLd    = buildArticleJsonLd(post as never);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name:"Home", url: SITE_URL },
    { name: meta.label, url:`${SITE_URL}/category/${primary.toLowerCase().replace("-","")}` },
    { name: post.title, url },
  ]);

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}/>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}/>

      <div className="max-w-content mx-auto bg-white border-x border-nd-border">
        <div className="max-w-[800px] mx-auto px-5 md:px-8 py-8 md:py-12">

          {/* Breadcrumb */}
          <nav className="font-sans text-[11px] text-nd-light mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-navy transition-colors">NajiyaDaily</Link>
            <span>›</span>
            <Link href={`/category/${primary.toLowerCase().replace("-","")}`}
                  className="hover:text-navy transition-colors">{meta.label}</Link>
          </nav>

          {/* Header */}
          <header className="border-b border-nd-border pb-5 mb-5">
            <div className="flex gap-2 flex-wrap mb-3">
              {post.labels.slice(0,2).map((l: string) => {
                const lm = getCategoryMeta(l);
                return (
                  <span key={l} className="nd-badge text-[10px] px-2.5 py-0.5"
                        style={{ background: lm.bgColor, color: lm.color }}>
                    {lm.emoji ? `${lm.emoji} ` : ""}{lm.label}
                  </span>
                );
              })}
            </div>
            <h1 className="font-serif text-[2.1rem] md:text-[2.6rem] font-black leading-[1.12]
                           tracking-[-0.5px] text-nd-ink mb-4">
              {post.title}
            </h1>
            {post.standfirst && (
              <p className="font-body italic text-[1.15rem] leading-relaxed text-nd-ink2 mb-4
                            border-l-2 border-nd-border pl-4">
                {post.standfirst}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-nd-border2">
              <div className="flex items-center gap-2.5 font-sans text-[12.5px] text-nd-muted">
                <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center
                                justify-center font-serif font-bold text-sm flex-shrink-0">N</div>
                <div>
                  <strong className="text-nd-ink">NajiyaDaily Editorial</strong>
                  <span className="mx-1">·</span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US",
                        { month:"long", day:"numeric", year:"numeric" })
                    : ""}
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { label:"𝕏 Post", href:`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}` },
                  { label:"💬 WhatsApp", href:`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title+" "+url)}` },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener"
                     className="font-sans text-[11px] font-semibold px-3 py-1.5 rounded border
                                border-nd-border bg-white hover:bg-cream hover:border-navy
                                text-nd-ink2 transition-all">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </header>

          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-3 py-3 border-b border-nd-border2 mb-6
                          font-sans text-[12px] text-nd-muted">
            <span className="bg-paper border border-nd-border rounded-full px-3 py-0.5">
              ⏱ {post.read_time} min read
            </span>
            <span className="bg-paper border border-nd-border rounded-full px-3 py-0.5">
              📝 {post.word_count.toLocaleString()} words
            </span>
          </div>

          {/* Hero image */}
          {post.featured_image && (
            <figure className="mb-6">
              <div className="relative w-full h-[300px] md:h-[480px]">
                <Image src={post.featured_image} alt={post.title}
                  fill priority unoptimized className="object-cover rounded"/>
              </div>
              {post.image_credit && (
                <figcaption className="font-sans text-[11px] text-nd-light text-right mt-2 italic">
                  {post.image_credit}
                </figcaption>
              )}
            </figure>
          )}

          {/* NajiyaDaily Explains */}
          {post.explains && (
            <div className="nd-explains mb-6">
              <p className="font-body text-[1rem] leading-[1.7] text-nd-ink2">{post.explains}</p>
            </div>
          )}

          {/* Why This Matters */}
          {post.why_matters && (
            <div className="nd-why-matters mb-6">
              <p className="font-body text-[1rem] leading-[1.7] text-nd-ink2">{post.why_matters}</p>
            </div>
          )}

          {/* Affiliate disclosure */}
          {post.labels.some((l: string) => ["Travel","Gadgets"].includes(l)) && (
            <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-gold
                            rounded-r-md p-3 mb-6 font-sans text-[12px] text-amber-800">
              <em>Disclosure: This article may contain affiliate links. NajiyaDaily may earn a commission at no extra cost to you.</em>
            </div>
          )}

          {/* Key Takeaways */}
          {post.takeaways?.length > 0 && (
            <div className="nd-takeaways mb-6">
              <ul className="space-y-2 ml-4 list-disc">
                {post.takeaways.map((t: string, i: number) => (
                  <li key={i} className="font-sans text-[14px] leading-[1.65] text-nd-ink2">{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ad slot */}
          <div className="my-6 flex items-center justify-center min-h-[90px] bg-paper
                          border border-nd-border rounded text-nd-light text-[11px]
                          font-sans tracking-widest uppercase">
            Advertisement
          </div>

          {/* Floating share + body */}
          <FloatingShare url={url} title={post.title}/>
          <div className="nd-article-body"
               dangerouslySetInnerHTML={{ __html: body }}/>

          {/* What Happens Next */}
          {post.whats_next?.length > 0 && (
            <div className="nd-whats-next mt-8">
              <ul className="space-y-2 ml-4 list-disc">
                {post.whats_next.map((w: string, i: number) => (
                  <li key={i} className="font-sans text-[14px] leading-[1.65] text-nd-ink2">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-10 pt-6 border-t border-nd-border">
            <div className="flex flex-wrap gap-2 mb-6">
              {post.labels.map((l: string) => {
                const lm = getCategoryMeta(l);
                return (
                  <Link key={l} href={`/category/${l.toLowerCase().replace("-","")}`}
                    className="font-sans text-[11.5px] px-3 py-1.5 border border-nd-border
                               rounded-full bg-cream hover:bg-navy hover:text-white
                               hover:border-navy transition-all text-nd-ink2">
                    #{lm.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-4 p-4 border border-nd-border rounded-lg bg-paper">
              <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center
                              justify-center font-serif text-xl font-black flex-shrink-0">N</div>
              <div>
                <h4 className="font-sans text-[13px] font-bold text-nd-ink mb-0.5">NajiyaDaily Editorial</h4>
                <p className="font-sans text-[12px] text-nd-muted leading-snug">
                  Real news, travel guides, gadget reviews and Daily Paws — published daily from Sri Lanka.
                </p>
              </div>
            </div>
          </footer>
        </div>
        <RelatedArticles currentSlug={post.slug} category={primary}/>
      </div>
    </>
  );
}
