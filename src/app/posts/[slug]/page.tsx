import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCategoryMeta, getPrimaryLabel } from "@/lib/categories";

export const revalidate = 300;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.najiyadaily.com";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from("articles").select("title,excerpt,standfirst,featured_image,slug,published_at,labels")
    .eq("slug", params.slug).maybeSingle();
  if (!data) return { title: "Not Found" };
  return {
    title: data.title + " | NajiyaDaily",
    description: data.excerpt || data.standfirst || "",
    openGraph: {
      type: "article", title: data.title,
      images: [{ url: data.featured_image || SITE + "/og-default.jpg" }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  // Select * so we get whatever columns exist — no crashes on missing columns
  const { data: post, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) {
    console.error("Article fetch error:", error.message);
    notFound();
  }
  if (!post) notFound();
  if (post.status !== "published") notFound();

  const primary  = getPrimaryLabel(post.labels || []);
  const meta     = getCategoryMeta(primary);
  const url      = SITE + "/posts/" + post.slug;
  const catColor = meta.color || "#052962";
  const isPaws   = (post.labels || []).includes("Daily-Paws");
  const isTravel = (post.labels || []).includes("Travel");

  // Body — try multiple fallbacks, never crash
  let body = "<p>This article is being loaded. Please check back shortly.</p>";
  try {
    if (post.body_html && typeof post.body_html === "string" && post.body_html.length > 50) {
      body = post.body_html;
    } else if (post.excerpt && typeof post.excerpt === "string" && post.excerpt.length > 20) {
      body = "<p>" + post.excerpt + "</p>";
    }
  } catch (_) {}

  const enc = (s: string) => encodeURIComponent(s);

  return (
    <div style={{ background: isPaws ? "#fff9f3" : "#f7f6f2", minHeight: "100vh" }}>

      {/* Reading progress */}
      <div id="nd-progress" style={{ position:"fixed", top:0, left:0, right:0, height:"3px", zIndex:9999 }}>
        <div id="nd-progress-bar" style={{ height:"3px", background:"linear-gradient(90deg,#052962,#d4af37)", width:"0%" }}/>
      </div>

      {/* Hero band */}
      <div style={{ background:`linear-gradient(135deg,${catColor}ee,${catColor}99)`, padding:"40px 20px 0" }}>
        <div style={{ maxWidth:"760px", margin:"0 auto" }}>

          {/* Breadcrumb */}
          <nav style={{ display:"flex", gap:"6px", alignItems:"center", marginBottom:"18px" }}>
            <Link href="/" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"rgba(255,255,255,.6)" }}>NajiyaDaily</Link>
            <span style={{ color:"rgba(255,255,255,.3)" }}>›</span>
            <Link href={"/category/"+primary.toLowerCase().replace("-","")}
              style={{ fontFamily:"var(--sans)", fontSize:"11px", fontWeight:500, color:"rgba(255,255,255,.85)" }}>
              {meta.label}
            </Link>
          </nav>

          {/* Category badge */}
          <div style={{ marginBottom:"14px" }}>
            <span style={{ fontFamily:"var(--sans)", fontSize:"9px", fontWeight:700, letterSpacing:"1.5px",
              textTransform:"uppercase", color:catColor, background:"rgba(255,255,255,.95)",
              padding:"3px 12px", borderRadius:"2px" }}>
              ● {meta.label}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"var(--serif)", fontSize:"clamp(1.7rem,4vw,2.7rem)", fontWeight:900,
            color:"#fff", lineHeight:1.1, letterSpacing:"-.5px", marginBottom:"14px",
            textShadow:"0 2px 20px rgba(0,0,0,.25)" }}>
            {post.title}
          </h1>

          {/* Standfirst */}
          {post.standfirst && (
            <p style={{ fontFamily:"var(--serif)", fontStyle:"italic", fontSize:"1.08rem",
              lineHeight:1.65, color:"rgba(255,255,255,.88)", marginBottom:"22px" }}>
              {post.standfirst.replace(/<[^>]+>/g, "")}
            </p>
          )}

          {/* Byline + share */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:"10px", paddingBottom:"20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"34px", height:"34px", borderRadius:"50%",
                background:"rgba(255,255,255,.15)", border:"2px solid rgba(255,255,255,.3)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"var(--serif)", fontSize:"13px", fontWeight:900, color:"#fff" }}>N</div>
              <div>
                <div style={{ fontFamily:"var(--sans)", fontSize:"12px", fontWeight:600, color:"#fff" }}>
                  NajiyaDaily Editorial
                </div>
                <div style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"rgba(255,255,255,.6)" }}>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US",
                        { month:"long", day:"numeric", year:"numeric" })
                    : ""}{" · "}{post.read_time || 1} min read
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              {[
                { label:"𝕏 Share", href:`https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}` },
                { label:"WhatsApp", href:`https://api.whatsapp.com/send?text=${enc(post.title+" "+url)}` },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener"
                  style={{ fontFamily:"var(--sans)", fontSize:"10px", fontWeight:600,
                    padding:"6px 12px", borderRadius:"3px",
                    background:"rgba(255,255,255,.15)", color:"#fff",
                    border:"1px solid rgba(255,255,255,.25)" }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Hero image */}
        {post.featured_image && (
          <div style={{ maxWidth:"900px", margin:"0 auto" }}>
            <div style={{ position:"relative", width:"100%", aspectRatio:"21/9", overflow:"hidden", maxHeight:"480px" }}>
              <Image src={post.featured_image} alt={post.title}
                fill style={{ objectFit:"cover" }} priority unoptimized />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"0 20px 60px" }}>

        {/* Meta pills */}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", padding:"14px 0",
          borderBottom:"1px solid #e2e2de", marginBottom:"24px" }}>
          <span style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"#6b6b78",
            background:"#fff", border:"1px solid #e2e2de", borderRadius:"20px", padding:"3px 12px" }}>
            ⏱ {post.read_time || 1} min read
          </span>
          <span style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"#6b6b78",
            background:"#fff", border:"1px solid #e2e2de", borderRadius:"20px", padding:"3px 12px" }}>
            📝 {(post.word_count || 0).toLocaleString()} words
          </span>
          {post.image_credit && (
            <span style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"#a8a8b2",
              marginLeft:"auto", fontStyle:"italic" }}>{post.image_credit}</span>
          )}
        </div>

        {/* NajiyaDaily Explains */}
        {post.explains && (
          <div style={{ background:"linear-gradient(135deg,#edf3ff,#f5f8ff)",
            borderLeft:"4px solid #052962", padding:"18px 20px", marginBottom:"22px",
            borderRadius:"0 8px 8px 0" }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:"9px", fontWeight:700,
              letterSpacing:"2px", textTransform:"uppercase", color:"#052962",
              opacity:.8, marginBottom:"8px" }}>NajiyaDaily explains</div>
            <p style={{ fontFamily:"var(--sans)", fontSize:"13px", lineHeight:1.7,
              color:"#2e2e3a", margin:0 }}>{post.explains}</p>
          </div>
        )}

        {/* Why This Matters */}
        {post.why_matters && (
          <div style={{ background:"linear-gradient(135deg,#fffbef,#fff9e6)",
            borderLeft:"4px solid #d4af37", padding:"18px 20px", marginBottom:"22px",
            borderRadius:"0 8px 8px 0" }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:"9px", fontWeight:700,
              letterSpacing:"2px", textTransform:"uppercase", color:"#7a5800",
              marginBottom:"8px" }}>Why this matters</div>
            <p style={{ fontFamily:"var(--sans)", fontSize:"13px", lineHeight:1.7,
              color:"#2e2e3a", margin:0 }}>{post.why_matters}</p>
          </div>
        )}

        {/* Key Takeaways — interactive drawer */}
        {post.takeaways && post.takeaways.length > 0 && (
          <div style={{ border:"1px solid #052962", borderRadius:"6px",
            overflow:"hidden", marginBottom:"22px" }}>
            <button id="nd-tk-btn"
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 16px", background:"#052962", color:"#fff", cursor:"pointer",
                fontFamily:"var(--sans)", fontSize:"12px", fontWeight:600,
                border:"none", width:"100%", textAlign:"left" }}>
              <span>
                <span style={{ display:"inline-block", width:"7px", height:"7px",
                  borderRadius:"50%", background:"#d4af37", marginRight:"8px",
                  verticalAlign:"middle" }}></span>
                Need the 30-second version? Read key takeaways
              </span>
              <span id="nd-tk-arrow">▼</span>
            </button>
            <div id="nd-tk-body" style={{ display:"none", padding:"14px 18px",
              background:"#efede8" }}>
              <ul style={{ marginLeft:"14px" }}>
                {post.takeaways.map((t: string, i: number) => (
                  <li key={i} style={{ fontFamily:"var(--sans)", fontSize:"13px",
                    lineHeight:1.7, color:"#2e2e3a", marginBottom:"6px" }}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Affiliate disclosure */}
        {(isTravel || (post.labels || []).includes("Gadgets")) && (
          <div style={{ background:"#fffbef", borderLeft:"3px solid #d4af37",
            padding:"10px 16px", marginBottom:"20px", borderRadius:"0 4px 4px 0" }}>
            <p style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#7a5800",
              margin:0, fontStyle:"italic" }}>
              Disclosure: This article may contain affiliate links. NajiyaDaily may earn a commission at no extra cost to you.
            </p>
          </div>
        )}

        {/* Article body */}
        <div className="nd-article-body" dangerouslySetInnerHTML={{ __html: body }} />

        {/* Travel booking widget */}
        {isTravel && (
          <div style={{ background:"linear-gradient(135deg,#041f4a,#052962)",
            borderRadius:"8px", padding:"18px 20px", margin:"24px 0",
            borderTop:"3px solid #d4af37" }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:"8px", fontWeight:600,
              letterSpacing:"2px", textTransform:"uppercase",
              color:"rgba(212,175,55,.8)", marginBottom:"4px" }}>Partner offer</div>
            <div style={{ fontFamily:"var(--serif)", fontSize:"1.05rem",
              fontWeight:700, color:"#fff", marginBottom:"4px" }}>
              Planning a trip to this destination?
            </div>
            <div style={{ fontFamily:"var(--sans)", fontSize:"12px",
              color:"rgba(255,255,255,.65)", marginBottom:"14px" }}>
              Compare local hotels · Free cancellation · Best rate guarantee
            </div>
            <a href="https://www.booking.com/?aid=101867344"
              target="_blank" rel="noopener sponsored"
              style={{ display:"inline-block", background:"#d4af37", color:"#041f4a",
                fontFamily:"var(--sans)", fontSize:"11px", fontWeight:700,
                letterSpacing:".5px", padding:"9px 20px", borderRadius:"3px" }}>
              Find hotels on Booking.com →
            </a>
          </div>
        )}

        {/* What Happens Next */}
        {post.whats_next && post.whats_next.length > 0 && (
          <div style={{ borderTop:"1px solid #dedbd4", borderBottom:"1px solid #dedbd4",
            padding:"18px 0", margin:"24px 0" }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:"9px", fontWeight:700,
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#a8a8b2", marginBottom:"12px" }}>What happens next</div>
            <ul style={{ marginLeft:"14px" }}>
              {post.whats_next.map((w: string, i: number) => (
                <li key={i} style={{ fontFamily:"var(--sans)", fontSize:"13px",
                  lineHeight:1.7, color:"#2e2e3a", marginBottom:"5px" }}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"24px" }}>
          {(post.labels || []).map((l: string) => {
            const lm = getCategoryMeta(l);
            return (
              <Link key={l} href={"/category/"+l.toLowerCase().replace("-","")}
                style={{ fontFamily:"var(--sans)", fontSize:"11px",
                  padding:"4px 12px", borderRadius:"2px",
                  background:"#fff", border:"1px solid #e2e2de", color:"#6b6b78" }}>
                #{lm.label}
              </Link>
            );
          })}
        </div>

        {/* E-E-A-T author block */}
        <div style={{ border:"1px solid #e2e2de", borderRadius:"8px",
          padding:"18px 20px", background:"#fff", marginBottom:"24px",
          display:"flex", alignItems:"flex-start", gap:"14px" }}>
          <div style={{ width:"48px", height:"48px", borderRadius:"50%",
            background:"#052962", color:"#fff", display:"flex",
            alignItems:"center", justifyContent:"center",
            fontFamily:"var(--serif)", fontSize:"18px", fontWeight:900, flexShrink:0 }}>N</div>
          <div>
            <div style={{ fontFamily:"var(--sans)", fontSize:"13px", fontWeight:600,
              color:"#0d0d14", marginBottom:"2px" }}>NajiyaDaily Newsroom</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:"10px",
              color:"#6b6b78", marginBottom:"6px" }}>
              Curated &amp; Edited by the NajiyaDaily Editorial Team
            </div>
            <div style={{ fontFamily:"var(--sans)", fontSize:"11px",
              color:"#6b6b78", lineHeight:1.55 }}>
              NajiyaDaily publishes daily editions covering World News, Travel, Technology,
              Culture and Daily Paws — independently, from Sri Lanka.
            </div>
            <div style={{ fontFamily:"var(--sans)", fontSize:"10px",
              color:"#a8a8b2", marginTop:"5px", fontStyle:"italic" }}>
              Editorial standards: AI-assisted research with human editorial review.
              All articles are fact-checked before publication.
            </div>
          </div>
        </div>

        {/* Share CTA */}
        <div style={{ background:`linear-gradient(135deg,${catColor}14,${catColor}06)`,
          border:`1px solid ${catColor}22`, padding:"24px 20px",
          textAlign:"center", borderRadius:"6px", marginBottom:"40px" }}>
          <div style={{ fontFamily:"var(--serif)", fontSize:"16px", fontWeight:700,
            color:"#0d0d14", marginBottom:"14px" }}>Found this useful? Share it.</div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap" }}>
            {[
              { label:"Share on 𝕏",  href:`https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}`, bg:"#000" },
              { label:"WhatsApp",    href:`https://api.whatsapp.com/send?text=${enc(post.title+" "+url)}`, bg:"#25d366" },
              { label:"Facebook",    href:`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, bg:"#1877f2" },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener"
                style={{ fontFamily:"var(--sans)", fontSize:"11px", fontWeight:600,
                  padding:"9px 18px", borderRadius:"3px", background:s.bg, color:"#fff" }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky reading footer */}
      <div id="nd-read-footer" style={{ position:"fixed", bottom:0, left:0, right:0,
        background:"rgba(5,41,98,.95)", padding:"8px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        zIndex:90, fontFamily:"var(--sans)",
        transform:"translateY(100%)", transition:"transform .3s ease" }}>
        <span id="nd-footer-pct" style={{ fontSize:"11px", color:"rgba(255,255,255,.6)" }}>0% read</span>
        <span id="nd-footer-left" style={{ fontSize:"11px", color:"#fff", fontWeight:500 }}>
          {post.read_time || 1} min left
        </span>
      </div>

      {/* Interactive scripts — all client-side, cannot crash server render */}
      <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var bar = document.getElementById('nd-progress-bar');
  var footer = document.getElementById('nd-read-footer');
  var pct = document.getElementById('nd-footer-pct');
  var left = document.getElementById('nd-footer-left');
  var readTime = ${post.read_time || 5};

  window.addEventListener('scroll', function(){
    var s = document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var p = h > 0 ? s/h : 0;
    var n = Math.round(p * 100);
    if(bar) bar.style.width = n + '%';
    if(footer){ if(n>10) footer.style.transform='translateY(0)'; else footer.style.transform='translateY(100%)'; }
    if(pct) pct.textContent = n + '% read';
    if(left) left.textContent = Math.max(0,Math.ceil(readTime*(1-p))) + ' min left';
  },{passive:true});

  var tkBtn = document.getElementById('nd-tk-btn');
  var tkBody = document.getElementById('nd-tk-body');
  var tkArrow = document.getElementById('nd-tk-arrow');
  if(tkBtn && tkBody){
    tkBtn.addEventListener('click', function(){
      var open = tkBody.style.display === 'block';
      tkBody.style.display = open ? 'none' : 'block';
      if(tkArrow) tkArrow.textContent = open ? '▼' : '▲';
    });
  }

  var obs = typeof IntersectionObserver !== 'undefined' && new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('nd-visible'); } });
  },{threshold:0.08});
  if(obs) document.querySelectorAll('.nd-fade-up').forEach(function(el){ obs.observe(el); });
})();
      `}}/>
    </div>
  );
}
