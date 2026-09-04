import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { getCategoryMeta, getPrimaryLabel } from "@/lib/categories";

export const revalidate = 300;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.najiyadaily.com";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  const { data } = await supabase
    .from("articles").select("slug")
    .eq("status","published").limit(100);
  return (data || []).map(function(r) { return { slug: r.slug }; });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("articles").select("*")
    .eq("slug", params.slug).single();
  if (!data) return { title: "Not Found" };
  const url = SITE_URL + "/posts/" + data.slug;
  const img = data.featured_image || SITE_URL + "/og-default.jpg";
  return {
    title: data.title + " | NajiyaDaily",
    description: data.excerpt || data.standfirst || "",
    alternates: { canonical: url },
    openGraph: {
      type: "article", title: data.title,
      description: data.excerpt || "",
      url, siteName: "NajiyaDaily",
      images: [{ url: img, width: 1200, height: 630 }],
      publishedTime: data.published_at || "",
      tags: data.labels,
    },
    twitter: { card: "summary_large_image", title: data.title,
               description: data.excerpt || "", images: [img] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { data: post } = await supabaseAdmin
    .from("articles").select("*")
    .eq("slug", params.slug).single();

  if (!post || post.status !== "published") notFound();

  const primary = getPrimaryLabel(post.labels);
  const meta    = getCategoryMeta(primary);
  const url     = SITE_URL + "/posts/" + post.slug;
  // Read body from Supabase — no filesystem dependency
  const body    = post.body_html || post.excerpt || "<p>Content unavailable.</p>";

  const cat_color = meta.color || "#052962";
  const enc = function(s: string) { return encodeURIComponent(s); };

  return (
    <div style={{ background: "#f7f7f5", minHeight: "100vh" }}>

      {/* Reading progress bar */}
      <div id="nd-progress" style={{ position:"fixed", top:0, left:0, right:0, height:"3px", zIndex:9999 }}>
        <div id="nd-progress-bar" style={{ height:"3px", background:"linear-gradient(90deg,#052962,#d4af37)", width:"0%" }} />
      </div>
      <script dangerouslySetInnerHTML={{ __html:
        `(function(){var b=document.getElementById('nd-progress-bar');
        window.addEventListener('scroll',function(){
          var s=document.documentElement.scrollTop;
          var h=document.documentElement.scrollHeight-document.documentElement.clientHeight;
          if(b&&h>0)b.style.width=(s/h*100)+'%';
        },{passive:true});})();`
      }} />

      {/* Hero section — full-width coloured band */}
      <div style={{
        background: "linear-gradient(135deg, " + cat_color + "ee 0%, " + cat_color + "bb 100%)",
        padding: "40px 20px 0",
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>

          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"20px" }}>
            <Link href="/" style={{
              fontFamily:"var(--sans)", fontSize:"11px", color:"rgba(255,255,255,0.6)",
              textDecoration:"none",
            }}>NajiyaDaily</Link>
            <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px" }}>›</span>
            <Link href={"/category/" + primary.toLowerCase().replace("-","")}
              style={{ fontFamily:"var(--sans)", fontSize:"11px",
                       color:"rgba(255,255,255,0.8)", textDecoration:"none", fontWeight:500 }}>
              {meta.label}
            </Link>
          </div>

          {/* Category pill */}
          <div style={{ marginBottom:"16px" }}>
            <span style={{
              fontFamily:"var(--sans)", fontSize:"10px", fontWeight:600,
              letterSpacing:"1.5px", textTransform:"uppercase",
              color: cat_color, background:"rgba(255,255,255,0.95)",
              padding:"4px 12px", borderRadius:"2px",
            }}>
              {meta.label}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily:"var(--serif)", fontSize:"clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight:900, color:"#fff", lineHeight:1.1,
            letterSpacing:"-0.5px", marginBottom:"16px",
            textShadow:"0 2px 20px rgba(0,0,0,0.2)",
          }}>
            {post.title}
          </h1>

          {/* Standfirst */}
          {post.standfirst && (
            <p style={{
              fontFamily:"var(--serif)", fontStyle:"italic",
              fontSize:"1.15rem", lineHeight:1.65,
              color:"rgba(255,255,255,0.88)", marginBottom:"24px",
            }}>
              {post.standfirst}
            </p>
          )}

          {/* Byline row */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:"12px", paddingBottom:"20px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{
                width:"36px", height:"36px", borderRadius:"50%",
                background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"var(--serif)", fontSize:"14px", fontWeight:900, color:"#fff",
              }}>N</div>
              <div>
                <div style={{ fontFamily:"var(--sans)", fontSize:"12px",
                              fontWeight:600, color:"#fff" }}>
                  NajiyaDaily Editorial
                </div>
                <div style={{ fontFamily:"var(--sans)", fontSize:"10px",
                              color:"rgba(255,255,255,0.6)", marginTop:"1px" }}>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US",
                        { weekday:"long", month:"long", day:"numeric", year:"numeric" })
                    : ""}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              {[
                { label:"Share on 𝕏", href:"https://twitter.com/intent/tweet?text="+enc(post.title)+"&url="+enc(url) },
                { label:"WhatsApp",   href:"https://api.whatsapp.com/send?text="+enc(post.title+" "+url) },
              ].map(function(s) {
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener"
                    style={{
                      fontFamily:"var(--sans)", fontSize:"10px", fontWeight:600,
                      padding:"6px 12px", borderRadius:"3px",
                      background:"rgba(255,255,255,0.15)", color:"#fff",
                      border:"1px solid rgba(255,255,255,0.25)",
                      textDecoration:"none", letterSpacing:"0.3px",
                    }}>
                    {s.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hero image — breaks out of the coloured band */}
        {post.featured_image && (
          <div style={{ maxWidth:"900px", margin:"0 auto", position:"relative" }}>
            <div style={{ position:"relative", width:"100%", paddingBottom:"52%", overflow:"hidden" }}>
              <Image src={post.featured_image} alt={post.title}
                fill style={{ objectFit:"cover" }} priority unoptimized />
            </div>
          </div>
        )}
      </div>

      {/* Article body */}
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"0 20px 60px" }}>

        {/* Meta pills */}
        <div style={{
          display:"flex", gap:"8px", flexWrap:"wrap",
          padding:"16px 0", borderBottom:"1px solid #e2e2de", marginBottom:"28px",
        }}>
          <span style={{
            fontFamily:"var(--sans)", fontSize:"10px", color:"#7a7a85",
            background:"#fff", border:"1px solid #e2e2de",
            borderRadius:"20px", padding:"3px 12px",
          }}>
            ⏱ {post.read_time} min read
          </span>
          <span style={{
            fontFamily:"var(--sans)", fontSize:"10px", color:"#7a7a85",
            background:"#fff", border:"1px solid #e2e2de",
            borderRadius:"20px", padding:"3px 12px",
          }}>
            📝 {(post.word_count || 0).toLocaleString()} words
          </span>
          {post.image_credit && (
            <span style={{
              fontFamily:"var(--sans)", fontSize:"10px", color:"#b0b0b8",
              marginLeft:"auto", fontStyle:"italic",
            }}>
              {post.image_credit}
            </span>
          )}
        </div>

        {/* NajiyaDaily Explains */}
        {post.explains && (
          <div style={{
            background:"#fff", borderLeft:"3px solid #052962",
            padding:"16px 20px", marginBottom:"24px",
            boxShadow:"0 1px 8px rgba(5,41,98,0.06)",
          }}>
            <div style={{
              fontFamily:"var(--sans)", fontSize:"8.5px", fontWeight:600,
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#052962", opacity:0.7, marginBottom:"8px",
            }}>
              NajiyaDaily explains
            </div>
            <p style={{ fontFamily:"var(--sans)", fontSize:"13px",
                        lineHeight:1.7, color:"#3a3a42", margin:0 }}>
              {post.explains}
            </p>
          </div>
        )}

        {/* Why This Matters */}
        {post.why_matters && (
          <div style={{
            background:"#fffbef", borderLeft:"3px solid #d4af37",
            padding:"16px 20px", marginBottom:"24px",
          }}>
            <div style={{
              fontFamily:"var(--sans)", fontSize:"8.5px", fontWeight:600,
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#7a5800", marginBottom:"8px",
            }}>
              Why this matters
            </div>
            <p style={{ fontFamily:"var(--sans)", fontSize:"13px",
                        lineHeight:1.7, color:"#3a3a42", margin:0 }}>
              {post.why_matters}
            </p>
          </div>
        )}

        {/* Key Takeaways */}
        {post.takeaways && post.takeaways.length > 0 && (
          <div style={{
            background:"#f0efec", padding:"16px 20px", marginBottom:"24px",
          }}>
            <div style={{
              fontFamily:"var(--sans)", fontSize:"8.5px", fontWeight:600,
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#7a7a85", marginBottom:"12px",
            }}>
              Key takeaways
            </div>
            <ul style={{ margin:0, paddingLeft:"16px" }}>
              {post.takeaways.map(function(t: string, i: number) {
                return (
                  <li key={i} style={{
                    fontFamily:"var(--sans)", fontSize:"13px",
                    lineHeight:1.65, color:"#3a3a42", marginBottom:"6px",
                  }}>
                    {t}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Affiliate disclosure */}
        {post.labels && post.labels.some(function(l: string) {
          return ["Travel","Gadgets"].includes(l);
        }) && (
          <div style={{
            background:"#fffbef", border:"1px solid #f0e68c",
            borderLeft:"3px solid #d4af37", padding:"10px 16px",
            marginBottom:"24px", borderRadius:"0 3px 3px 0",
          }}>
            <p style={{ fontFamily:"var(--sans)", fontSize:"11px",
                        color:"#7a5800", margin:0, fontStyle:"italic" }}>
              Disclosure: This article may contain affiliate links.
              NajiyaDaily may earn a small commission at no extra cost to you.
            </p>
          </div>
        )}

        {/* Article body — rendered HTML */}
        <div style={{
          fontFamily:"Georgia, 'Playfair Display', serif",
          fontSize:"1.08rem", lineHeight:1.9, color:"#2a2a32",
        }}
          dangerouslySetInnerHTML={{ __html: body }}
        />

        {/* What Happens Next */}
        {post.whats_next && post.whats_next.length > 0 && (
          <div style={{
            borderTop:"1px solid #e2e2de", borderBottom:"1px solid #e2e2de",
            padding:"16px 0", margin:"32px 0",
          }}>
            <div style={{
              fontFamily:"var(--sans)", fontSize:"8.5px", fontWeight:600,
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#7a7a85", marginBottom:"12px",
            }}>
              What happens next
            </div>
            <ul style={{ margin:0, paddingLeft:"16px" }}>
              {post.whats_next.map(function(w: string, i: number) {
                return (
                  <li key={i} style={{
                    fontFamily:"var(--sans)", fontSize:"13px",
                    lineHeight:1.65, color:"#3a3a42", marginBottom:"6px",
                  }}>
                    {w}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"28px" }}>
          {(post.labels || []).map(function(l: string) {
            const lm = getCategoryMeta(l);
            return (
              <Link key={l}
                href={"/category/" + l.toLowerCase().replace("-","")}
                style={{
                  fontFamily:"var(--sans)", fontSize:"11px",
                  padding:"4px 12px", borderRadius:"2px",
                  background:"#fff", border:"1px solid #e2e2de",
                  color:"#7a7a85", textDecoration:"none",
                }}>
                #{lm.label}
              </Link>
            );
          })}
        </div>

        {/* Author card */}
        <div style={{
          display:"flex", alignItems:"center", gap:"14px",
          padding:"16px 20px", background:"#fff",
          border:"1px solid #e2e2de", marginBottom:"40px",
        }}>
          <div style={{
            width:"44px", height:"44px", borderRadius:"50%",
            background:"#052962", color:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"var(--serif)", fontSize:"18px", fontWeight:900, flexShrink:0,
          }}>N</div>
          <div>
            <div style={{ fontFamily:"var(--sans)", fontSize:"13px",
                          fontWeight:600, color:"#111118", marginBottom:"3px" }}>
              NajiyaDaily Editorial
            </div>
            <div style={{ fontFamily:"var(--sans)", fontSize:"11px",
                          color:"#7a7a85", lineHeight:1.5 }}>
              Real news, travel guides, gadget reviews and Daily Paws
              — published daily from Sri Lanka.
            </div>
          </div>
        </div>

        {/* Share row — bottom */}
        <div style={{
          background: "linear-gradient(135deg, " + cat_color + "18, " + cat_color + "08)",
          border:"1px solid " + cat_color + "30",
          padding:"20px", marginBottom:"40px", textAlign:"center",
        }}>
          <div style={{ fontFamily:"var(--serif)", fontSize:"16px",
                        fontWeight:700, color:"#111118", marginBottom:"12px" }}>
            Found this useful? Share it.
          </div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap" }}>
            {[
              { label:"Share on 𝕏",    href:"https://twitter.com/intent/tweet?text="+enc(post.title)+"&url="+enc(url), bg:"#000" },
              { label:"WhatsApp",       href:"https://api.whatsapp.com/send?text="+enc(post.title+" "+url), bg:"#25d366" },
              { label:"Facebook",       href:"https://www.facebook.com/sharer/sharer.php?u="+enc(url), bg:"#1877f2" },
            ].map(function(s) {
              return (
                <a key={s.label} href={s.href} target="_blank" rel="noopener"
                  style={{
                    fontFamily:"var(--sans)", fontSize:"11px", fontWeight:600,
                    padding:"8px 18px", borderRadius:"3px",
                    background:s.bg, color:"#fff", textDecoration:"none",
                    letterSpacing:"0.3px",
                  }}>
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
