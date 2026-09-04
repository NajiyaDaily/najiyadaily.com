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
  const { data } = await supabase.from("articles").select("slug").eq("status","published").limit(100);
  return (data || []).map(function(r: { slug: string }) { return { slug: r.slug }; });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase.from("articles").select("title,excerpt,standfirst,featured_image,slug,published_at,labels").eq("slug",params.slug).single();
  if (!data) return { title: "Not Found" };
  const url = SITE_URL + "/posts/" + data.slug;
  const img = data.featured_image || SITE_URL + "/og-default.jpg";
  return {
    title: data.title + " | NajiyaDaily",
    description: data.excerpt || data.standfirst || "",
    alternates: { canonical: url },
    openGraph: { type:"article", title:data.title, description:data.excerpt||"", url, siteName:"NajiyaDaily", images:[{ url:img, width:1200, height:630 }], publishedTime:data.published_at||"", tags:data.labels||[] },
    twitter: { card:"summary_large_image", title:data.title, description:data.excerpt||"", images:[img] },
  };
}

// Travel Factsheet component
function TravelFactsheet({ destination }: { destination: string }) {
  return (
    <div className="nd-travel-factsheet">
      <div className="nd-travel-factsheet-hdr">Quick Destination Factsheet — {destination}</div>
      <div className="nd-travel-factsheet-grid">
        {[
          { label:"Best months",    value:"Apr–Jun, Sep–Nov" },
          { label:"Avg daily budget", value:"$80–$140 USD" },
          { label:"Flight time (CMB)", value:"~12–16 hrs" },
          { label:"Booking.com deals", value:"Free cancellation" },
        ].map(function(item) { return (
          <div key={item.label} className="nd-travel-factsheet-item">
            <div className="nd-travel-factsheet-item-label">{item.label}</div>
            <div className="nd-travel-factsheet-item-value">{item.value}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

// Booking widget
function BookingWidget({ destination }: { destination: string }) {
  return (
    <div className="nd-booking-widget">
      <div className="nd-booking-widget-label">Partner offer</div>
      <div className="nd-booking-widget-title">Planning a trip to {destination}?</div>
      <div className="nd-booking-widget-sub">Compare local hotels · Free cancellation · Best rate guarantee</div>
      <a href={`https://www.booking.com/search.html?ss=${encodeURIComponent(destination)}&aid=101867344`}
        target="_blank" rel="noopener sponsored"
        className="nd-booking-widget-btn">
        Find hotels on Booking.com →
      </a>
    </div>
  );
}

// Interactive scripts
const ArticleScripts = ({ slug, readTime, nextSlug, nextTitle }: {
  slug: string; readTime: number; nextSlug: string; nextTitle: string;
}) => (
  <>
    <script dangerouslySetInnerHTML={{ __html: `
(function(){
  /* Reading progress bar */
  var bar = document.getElementById('nd-progress-bar');
  var footer = document.getElementById('nd-read-footer');
  var pct = document.getElementById('nd-read-footer-pct');
  var left = document.getElementById('nd-read-footer-left');
  var nextStory = document.getElementById('nd-next-story');
  var readTime = ${readTime};

  window.addEventListener('scroll', function(){
    var s = document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var progress = h > 0 ? s/h : 0;
    var pctNum = Math.round(progress * 100);

    if (bar) bar.style.width = pctNum + '%';

    /* Sticky reading footer at 10% */
    if (footer) {
      if (pctNum > 10) footer.classList.add('visible');
      else footer.classList.remove('visible');
    }
    if (pct) pct.textContent = pctNum + '% read';
    if (left) {
      var minsLeft = Math.max(0, Math.ceil(readTime * (1 - progress)));
      left.textContent = minsLeft + ' min left';
    }

    /* Next story drawer at 80% */
    if (nextStory && pctNum > 80) nextStory.classList.add('visible');
  }, { passive: true });

  /* Takeaways drawer toggle */
  var trigger = document.getElementById('nd-takeaways-trigger');
  var body = document.getElementById('nd-takeaways-body');
  if (trigger && body) {
    trigger.addEventListener('click', function(){
      body.classList.toggle('open');
      trigger.querySelector('.arrow').textContent = body.classList.contains('open') ? '▲' : '▼';
    });
  }

  /* Text highlight popover */
  var popover = document.getElementById('nd-highlight-popover');
  document.addEventListener('mouseup', function(){
    var sel = window.getSelection();
    if (!sel || sel.toString().trim().length < 10 || !popover) return;
    var range = sel.getRangeAt(0);
    var rect = range.getBoundingClientRect();
    popover.style.top = (window.scrollY + rect.top - 44) + 'px';
    popover.style.left = (rect.left + rect.width/2 - 80) + 'px';
    popover.classList.add('visible');
  });
  document.addEventListener('mousedown', function(e){
    if (popover && !popover.contains(e.target)) popover.classList.remove('visible');
  });

  /* Scroll fade-in for cards */
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('nd-visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.nd-fade-up').forEach(function(el){ obs.observe(el); });
})();
    `}} />
  </>
);

export default async function ArticlePage({ params }: Props) {
  const { data: post, error } = await supabaseAdmin
    .from("articles").select("*")
    .eq("slug", params.slug).single();

  if (error || !post || post.status !== "published") notFound();

  const primary   = getPrimaryLabel(post.labels || []);
  const meta      = getCategoryMeta(primary);
  const url       = SITE_URL + "/posts/" + post.slug;
  const catColor  = meta.color || "#052962";
  const isTravel  = post.labels?.includes("Travel");
  const isPaws    = post.labels?.includes("Daily-Paws");

  const body = (post.body_html && post.body_html.length > 100)
    ? post.body_html
    : post.excerpt ? "<p>" + post.excerpt + "</p>"
    : "<p>Full article content will appear here after the next publish run.</p>";

  const destination = isTravel
    ? (post.title.match(/(?:in|to|from|visiting)\s+([A-Z][a-zA-Z\s]{3,20})/)?.[1] || "this destination")
    : "";

  const enc = function(s: string) { return encodeURIComponent(s); };
  const bgStyle = isPaws ? { background: "#fff9f3" } : {};

  return (
    <div style={{ background: "#f7f6f2", minHeight: "100vh" }}>
      {/* Progress bar */}
      <div id="nd-progress" style={{ position:"fixed", top:0, left:0, right:0, height:"3px", zIndex:9999 }}>
        <div id="nd-progress-bar" style={{ height:"3px", background:"linear-gradient(90deg,#052962,#d4af37)", width:"0%" }}/>
      </div>

      {/* Text highlight popover */}
      <div id="nd-highlight-popover" style={{ position:"fixed" }}>
        <button className="nd-popover-btn" onClick={() => {}}>𝕏 Share</button>
        <button className="nd-popover-btn" onClick={() => {}}>Copy quote</button>
        <button className="nd-popover-btn" onClick={() => {}}>WhatsApp</button>
      </div>

      {/* Category colour hero band */}
      <div style={{ background:`linear-gradient(135deg,${catColor}ee 0%,${catColor}99 100%)`, padding:"40px 20px 0" }}>
        <div style={{ maxWidth:"760px", margin:"0 auto" }}>
          {/* Breadcrumb */}
          <nav style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"18px" }}>
            <Link href="/" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"rgba(255,255,255,.55)" }}>NajiyaDaily</Link>
            <span style={{ color:"rgba(255,255,255,.3)" }}>›</span>
            <Link href={"/category/"+primary.toLowerCase().replace("-","")}
              style={{ fontFamily:"var(--sans)", fontSize:"11px", fontWeight:500, color:"rgba(255,255,255,.85)" }}>
              {meta.label}
            </Link>
          </nav>

          {/* Micro-tag */}
          <div style={{ marginBottom:"14px" }}>
            <span className="nd-micro-tag" style={{ color:catColor, background:"rgba(255,255,255,.95)", padding:"3px 12px", borderRadius:"2px", fontSize:"9px" }}>
              {meta.label}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"var(--serif)", fontSize:"clamp(1.75rem,4vw,2.8rem)", fontWeight:900, color:"#fff", lineHeight:1.1, letterSpacing:"-.5px", marginBottom:"16px", textShadow:"0 2px 20px rgba(0,0,0,.25)" }}>
            {post.title}
          </h1>

          {/* Standfirst */}
          {post.standfirst && (
            <p style={{ fontFamily:"var(--serif)", fontStyle:"italic", fontSize:"1.1rem", lineHeight:1.65, color:"rgba(255,255,255,.88)", marginBottom:"24px" }}>
              {post.standfirst}
            </p>
          )}

          {/* Byline */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px", paddingBottom:"20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(255,255,255,.15)", border:"2px solid rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--serif)", fontSize:"14px", fontWeight:900, color:"#fff" }}>N</div>
              <div>
                <div style={{ fontFamily:"var(--sans)", fontSize:"12px", fontWeight:600, color:"#fff" }}>NajiyaDaily Editorial</div>
                <div style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"rgba(255,255,255,.6)", marginTop:"1px" }}>
                  {post.published_at ? new Date(post.published_at).toLocaleDateString("en-US",{ weekday:"long", month:"long", day:"numeric", year:"numeric" }) : ""} · {post.read_time} min read
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              {[
                { label:"𝕏 Post", href:`https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}` },
                { label:"WhatsApp", href:`https://api.whatsapp.com/send?text=${enc(post.title+" "+url)}` },
              ].map(function(s) { return (
                <a key={s.label} href={s.href} target="_blank" rel="noopener"
                  style={{ fontFamily:"var(--sans)", fontSize:"10px", fontWeight:600, padding:"6px 12px", borderRadius:"3px", background:"rgba(255,255,255,.15)", color:"#fff", border:"1px solid rgba(255,255,255,.25)" }}>
                  {s.label}
                </a>
              ); })}
            </div>
          </div>
        </div>

        {/* Hero image */}
        {post.featured_image && (
          <div style={{ maxWidth:"900px", margin:"0 auto" }}>
            <div className="nd-img-hero" style={{ maxHeight:"480px" }}>
              <Image src={post.featured_image} alt={post.title} fill style={{ objectFit:"cover" }} priority unoptimized/>
            </div>
          </div>
        )}
      </div>

      {/* Article content */}
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"0 20px 60px", ...bgStyle }}>
        {/* Meta row */}
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", padding:"16px 0", borderBottom:"1px solid #e2e2de", marginBottom:"28px", alignItems:"center" }}>
          <span style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"#7a7a85", background:"#fff", border:"1px solid #e2e2de", borderRadius:"20px", padding:"3px 12px" }}>⏱ {post.read_time} min read</span>
          <span style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"#7a7a85", background:"#fff", border:"1px solid #e2e2de", borderRadius:"20px", padding:"3px 12px" }}>📝 {(post.word_count||0).toLocaleString()} words</span>
          {post.image_credit && <span style={{ marginLeft:"auto", fontFamily:"var(--sans)", fontSize:"10px", color:"#b0b0b8", fontStyle:"italic" }}>{post.image_credit}</span>}
        </div>

        {/* Travel factsheet */}
        {isTravel && destination && <TravelFactsheet destination={destination} />}

        {/* Daily Paws paw divider */}
        {isPaws && (
          <div className="nd-paws-divider">🐾 🐾 🐾</div>
        )}

        {/* NajiyaDaily Explains */}
        {post.explains && (
          <div className="nd-explains">
            <p style={{ fontFamily:"var(--sans)", fontSize:"13px", lineHeight:1.7, color:"var(--ink2)" }}>{post.explains}</p>
          </div>
        )}

        {/* Why This Matters */}
        {post.why_matters && (
          <div className="nd-why">
            <p style={{ fontFamily:"var(--sans)", fontSize:"13px", lineHeight:1.7, color:"var(--ink2)" }}>{post.why_matters}</p>
          </div>
        )}

        {/* Interactive Takeaways drawer */}
        {post.takeaways && post.takeaways.length > 0 && (
          <div className="nd-takeaways-drawer">
            <button id="nd-takeaways-trigger" className="nd-takeaways-trigger">
              <span><span className="pulse"></span>Need the 30-second version? Read key takeaways</span>
              <span className="arrow">▼</span>
            </button>
            <div id="nd-takeaways-body" className="nd-takeaways-body">
              <ul>{post.takeaways.map(function(t: string, i: number) { return <li key={i}>{t}</li>; })}</ul>
            </div>
          </div>
        )}

        {/* Affiliate disclosure */}
        {post.labels && post.labels.some(function(l: string) { return ["Travel","Gadgets"].includes(l); }) && (
          <div style={{ background:"#fffbef", borderLeft:"3px solid #d4af37", padding:"10px 16px", marginBottom:"20px", borderRadius:"0 4px 4px 0" }}>
            <p style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#7a5800", margin:0, fontStyle:"italic" }}>
              Disclosure: This article may contain affiliate links. NajiyaDaily may earn a small commission at no extra cost to you.
            </p>
          </div>
        )}

        {/* Article body with drop cap */}
        <div className="nd-article-body" dangerouslySetInnerHTML={{ __html: body }}/>

        {/* Booking widget in Travel articles */}
        {isTravel && destination && <BookingWidget destination={destination} />}

        {/* Daily Paws closing divider */}
        {isPaws && <div className="nd-paws-divider">🐾 🐾 🐾</div>}

        {/* What Happens Next */}
        {post.whats_next && post.whats_next.length > 0 && (
          <div className="nd-next">
            <ul>{post.whats_next.map(function(w: string, i: number) { return <li key={i}>{w}</li>; })}</ul>
          </div>
        )}

        {/* Tags */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"24px" }}>
          {(post.labels||[]).map(function(l: string) {
            const lm = getCategoryMeta(l);
            return (
              <Link key={l} href={"/category/"+l.toLowerCase().replace("-","")}
                style={{ fontFamily:"var(--sans)", fontSize:"11px", padding:"4px 12px", borderRadius:"2px", background:"#fff", border:"1px solid #e2e2de", color:"#7a7a85" }}>
                #{lm.label}
              </Link>
            );
          })}
        </div>

        {/* E-E-A-T Author block */}
        <div className="nd-author-block">
          <div className="nd-author-block-av">N</div>
          <div>
            <div className="nd-author-block-name">NajiyaDaily Newsroom</div>
            <div className="nd-author-block-role">Curated &amp; Edited by the NajiyaDaily Editorial Team</div>
            <div className="nd-author-block-eeeat">
              NajiyaDaily publishes daily editions covering World News, Travel, Technology, Culture and Daily Paws — independently, from Sri Lanka.
            </div>
            <div className="nd-author-block-standards">
              Editorial standards: We use AI-assisted research and human editorial review. All articles are checked for accuracy before publication.
            </div>
          </div>
        </div>

        {/* Share CTA */}
        <div style={{ background:`linear-gradient(135deg,${catColor}15,${catColor}06)`, border:`1px solid ${catColor}25`, padding:"24px 20px", marginBottom:"40px", textAlign:"center", borderRadius:"6px" }}>
          <div style={{ fontFamily:"var(--serif)", fontSize:"16px", fontWeight:700, color:"var(--ink)", marginBottom:"14px" }}>Found this useful? Share it.</div>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap" }}>
            {[
              { label:"Share on 𝕏", href:`https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}`, bg:"#000" },
              { label:"WhatsApp",   href:`https://api.whatsapp.com/send?text=${enc(post.title+" "+url)}`, bg:"#25d366" },
              { label:"Facebook",   href:`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, bg:"#1877f2" },
            ].map(function(s) { return (
              <a key={s.label} href={s.href} target="_blank" rel="noopener"
                style={{ fontFamily:"var(--sans)", fontSize:"11px", fontWeight:600, padding:"9px 18px", borderRadius:"3px", background:s.bg, color:"#fff" }}>
                {s.label}
              </a>
            ); })}
          </div>
        </div>
      </div>

      {/* Sticky reading footer */}
      <div id="nd-read-footer">
        <span id="nd-read-footer-pct" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"rgba(255,255,255,.6)" }}>0% read</span>
        <span id="nd-read-footer-left" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#fff", fontWeight:500 }}>{post.read_time} min left</span>
      </div>

      {/* Next story drawer */}
      <div id="nd-next-story">
        <div className="nd-next-story-label">Up next →</div>
        <div className="nd-next-story-title">More from NajiyaDaily</div>
        <Link href="/" className="nd-next-story-btn">View all stories</Link>
      </div>

      {/* All interactive scripts */}
      <ArticleScripts slug={post.slug} readTime={post.read_time||5} nextSlug="" nextTitle=""/>
    </div>
  );
}
