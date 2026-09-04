import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ArticleRow } from "@/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "NajiyaDaily — Stories Worth Your Time",
  description: "Real news, travel guides, gadget reviews and Daily Paws — published daily from Sri Lanka.",
};

const CAT: Record<string, { color: string; bg: string }> = {
  "World":     { color: "#1546a0", bg: "#edf2ff" },
  "Tech":      { color: "#5a1d9a", bg: "#f5f0ff" },
  "Culture":   { color: "#8b1a00", bg: "#fff1ee" },
  "Science":   { color: "#0a5c6e", bg: "#e8f7f9" },
  "Music":     { color: "#8b1a00", bg: "#fff1ee" },
  "Opinion":   { color: "#7a4000", bg: "#fff8ee" },
  "Travel":    { color: "#0d6e5e", bg: "#edfaf7" },
  "Daily-Paws":{ color: "#a0195a", bg: "#ffeef5" },
  "Morning":   { color: "#7a4000", bg: "#fff8ee" },
  "Afternoon": { color: "#1a5e35", bg: "#edf7f1" },
  "Evening":   { color: "#3d1a7a", bg: "#f2eeff" },
  "Gadgets":   { color: "#1546a0", bg: "#edf2ff" },
};

function getPrimary(labels: string[]): string {
  const order = ["Daily-Paws","Travel","Morning","Afternoon","Evening",
                  "World","Tech","Culture","Science","Music","Opinion","Gadgets"];
  return order.find(l => labels.includes(l)) || labels[0] || "World";
}

function fmtLabel(l: string) { return l === "Daily-Paws" ? "Daily Paws" : l; }

function CatBar({ label, size = 14 }: { label: string; size?: number }) {
  const c = CAT[label] || { color: "#052962", bg: "#f0f4ff" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
      <div style={{ width:"2px", height:`${size}px`, background:c.color, flexShrink:0 }} />
      <span style={{ fontFamily:"var(--sans)", fontSize:"9px", fontWeight:600,
        letterSpacing:"1px", textTransform:"uppercase", color:c.color }}>
        {fmtLabel(label)}
      </span>
    </div>
  );
}

function MetaLine({ post }: { post: ArticleRow }) {
  return (
    <div style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"#a8a8b2", marginTop:"6px",
      display:"flex", alignItems:"center", gap:"8px" }}>
      <span>
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-US",
              { month:"short", day:"numeric" })
          : ""}
      </span>
      <span style={{ width:"2px", height:"2px", borderRadius:"50%",
        background:"#a8a8b2", display:"inline-block" }} />
      <span>{post.read_time} min read</span>
    </div>
  );
}

// ── HERO CARD ────────────────────────────────────────────────────
function HeroCard({ post }: { post: ArticleRow }) {
  const primary = getPrimary(post.labels);
  const c = CAT[primary] || { color:"#052962", bg:"#f0f4ff" };
  return (
    <article style={{ display:"flex", flexDirection:"column", height:"100%", background:"#fff" }}>
      <Link href={`/posts/${post.slug}`} style={{ display:"block", flexShrink:0 }}>
        {post.featured_image ? (
          <div style={{ position:"relative", width:"100%", height:"320px", overflow:"hidden" }}>
            <Image src={post.featured_image} alt={post.title}
              fill style={{ objectFit:"cover",
                transition:"transform .5s ease" }}
              priority unoptimized sizes="(max-width:900px) 100vw, 65vw" />
            {/* Category overlay */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0,
              background:"linear-gradient(0deg, rgba(5,41,98,.75) 0%, transparent 100%)",
              padding:"40px 20px 16px",
            }}>
              <span style={{
                fontFamily:"var(--sans)", fontSize:"9px", fontWeight:700,
                letterSpacing:"1.5px", textTransform:"uppercase",
                color:"#fff", background:c.color,
                padding:"3px 10px", borderRadius:"1px",
              }}>{fmtLabel(primary)}</span>
            </div>
          </div>
        ) : (
          <div style={{ width:"100%", height:"320px",
            background:`linear-gradient(135deg, ${c.color}dd, ${c.color}88)`,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"var(--serif)", fontSize:"80px",
              fontWeight:900, color:"rgba(255,255,255,.15)" }}>ND</span>
          </div>
        )}
      </Link>
      <div style={{ padding:"22px 24px", flex:1, display:"flex",
        flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <Link href={`/posts/${post.slug}`}>
            <h2 style={{
              fontFamily:"var(--serif)", fontSize:"clamp(1.4rem,2.2vw,1.9rem)",
              fontWeight:900, color:"#0d0d14", lineHeight:1.15,
              letterSpacing:"-.3px", marginBottom:"10px",
              transition:"color .15s",
            }}>
              {post.title}
            </h2>
          </Link>
          {post.standfirst && (
            <p style={{ fontFamily:"var(--serif)", fontStyle:"italic",
              fontSize:".95rem", color:"#4a4a56", lineHeight:1.65,
              marginBottom:"12px" }}>
              {post.standfirst}
            </p>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", flexWrap:"wrap", gap:"8px" }}>
          <MetaLine post={post} />
          <Link href={`/posts/${post.slug}`} style={{
            fontFamily:"var(--sans)", fontSize:"11px", fontWeight:600,
            color:c.color, display:"flex", alignItems:"center", gap:"4px",
          }}>
            Read story <span style={{ fontSize:"14px" }}>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── RIGHT STACK CARD ─────────────────────────────────────────────
function StackCard({ post, last }: { post: ArticleRow; last?: boolean }) {
  const primary = getPrimary(post.labels);
  return (
    <article style={{
      padding:"14px 18px", flex:1,
      borderBottom: last ? "none" : "1px solid #eceae5",
      display:"flex", flexDirection:"column", gap:"8px",
      background:"#fff", transition:"background .15s",
    }}>
      <CatBar label={primary} />
      <Link href={`/posts/${post.slug}`}>
        <h3 style={{ fontFamily:"var(--serif)", fontSize:"1rem",
          fontWeight:700, color:"#0d0d14", lineHeight:1.3 }}>
          {post.title}
        </h3>
      </Link>
      <MetaLine post={post} />
    </article>
  );
}

// ── NUMBERED STORY ROW ───────────────────────────────────────────
function StoryRow({ post, num }: { post: ArticleRow; num: number }) {
  const primary = getPrimary(post.labels);
  const numStr  = num < 10 ? `0${num}` : `${num}`;
  return (
    <article className="nd-story-row">
      {/* Number */}
      <div style={{ fontFamily:"var(--serif)", fontSize:"2rem", fontWeight:900,
        color:"#dedbd4", lineHeight:1, width:"32px", flexShrink:0, paddingTop:"2px" }}>
        {numStr}
      </div>
      {/* Thumb */}
      {post.featured_image && (
        <div style={{ width:"88px", height:"70px", flexShrink:0,
          position:"relative", overflow:"hidden" }}>
          <Image src={post.featured_image} alt={post.title}
            fill style={{ objectFit:"cover" }} sizes="88px" unoptimized />
        </div>
      )}
      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <CatBar label={primary} size={11} />
        <Link href={`/posts/${post.slug}`} style={{ display:"block", marginTop:"5px" }}>
          <h3 style={{ fontFamily:"var(--serif)", fontSize:"1.02rem",
            fontWeight:700, color:"#0d0d14", lineHeight:1.28 }}>
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p style={{ fontFamily:"var(--sans)", fontSize:"12px",
            color:"#6b6b78", lineHeight:1.5, marginTop:"4px",
            display:"-webkit-box", WebkitLineClamp:2,
            WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {post.excerpt}
          </p>
        )}
        <MetaLine post={post} />
      </div>
    </article>
  );
}

// ── BOOKING STRIP ────────────────────────────────────────────────
function BookingStrip() {
  return (
    <div style={{
      background:"linear-gradient(135deg, #041f4a, #052962)",
      padding:"18px 24px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      gap:"16px", flexWrap:"wrap",
      borderTop:"3px solid #d4af37",
    }}>
      <div>
        <div style={{ fontFamily:"var(--sans)", fontSize:"9px", fontWeight:600,
          letterSpacing:"2px", textTransform:"uppercase",
          color:"rgba(212,175,55,.8)", marginBottom:"3px" }}>
          Partner offer
        </div>
        <div style={{ fontFamily:"var(--sans)", fontSize:"13px",
          color:"rgba(255,255,255,.9)", fontWeight:500 }}>
          <strong style={{ color:"#fff" }}>Travelling soon?</strong>{" "}
          Best hotel rates — free cancellation, no markup.
        </div>
      </div>
      <a href="https://www.booking.com/?aid=101867344"
        target="_blank" rel="noopener sponsored"
        style={{
          fontFamily:"var(--sans)", fontSize:"11px", fontWeight:600,
          letterSpacing:".5px", background:"#d4af37", color:"#041f4a",
          padding:"9px 20px", borderRadius:"2px", textDecoration:"none",
          whiteSpace:"nowrap", flexShrink:0,
        }}>
        Search Hotels →
      </a>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────
export default async function HomePage() {
  const { data: posts } = await supabase
    .from("articles").select("*")
    .eq("status","published")
    .order("published_at", { ascending: false })
    .limit(20);

  if (!posts || posts.length === 0) {
    return (
      <div style={{ maxWidth:"1300px", margin:"0 auto", background:"#fff",
        minHeight:"70vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:"80px 20px" }}>
          <div style={{ fontFamily:"var(--serif)", fontSize:"72px",
            fontWeight:900, color:"#dedbd4", marginBottom:"16px",
            letterSpacing:"-2px" }}>ND</div>
          <p style={{ fontFamily:"var(--sans)", fontSize:"14px", color:"#a8a8b2" }}>
            First stories publishing soon.
          </p>
        </div>
      </div>
    );
  }

  function rank(p: ArticleRow) {
    const order = ["Daily-Paws","Travel","Morning","Afternoon","Evening",
                   "World","Tech","Culture","Science","Music","Opinion"];
    const idx = order.findIndex(l => p.labels.includes(l));
    return idx === -1 ? 99 : idx;
  }

  const sorted  = [...posts].sort((a, b) => rank(a) - rank(b));
  const hero    = sorted[0];
  const stack   = sorted.slice(1, 4);
  const stories = sorted.slice(4);

  return (
    <div style={{ maxWidth:"1300px", margin:"0 auto" }}>

      {/* ── FEATURE ZONE ─────────────────────────────────────── */}
      <div className="nd-feature-grid">
        {/* Hero */}
        <div style={{ borderRight:"1px solid #dedbd4" }}>
          {hero && <HeroCard post={hero} />}
        </div>
        {/* Right stack */}
        <div style={{ display:"flex", flexDirection:"column" }}>
          {stack.map((p, i) => (
            <StackCard key={p.id} post={p} last={i === stack.length - 1 && stories.length === 0} />
          ))}
          {/* Subscribe widget */}
          <div style={{ padding:"16px 18px", borderTop:"1px solid #eceae5",
            background:"#f7f6f2", flex:1 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:"9px", fontWeight:600,
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#a8a8b2", marginBottom:"8px" }}>
              Daily digest
            </div>
            <p style={{ fontFamily:"var(--sans)", fontSize:"12px",
              color:"#6b6b78", lineHeight:1.5, marginBottom:"12px" }}>
              Three stories a day. No spam, ever.
            </p>
            <div style={{ display:"flex", gap:"6px" }}>
              <input type="email" placeholder="your@email.com"
                style={{ flex:1, fontFamily:"var(--sans)", fontSize:"12px",
                  border:"1px solid #dedbd4", borderRadius:"2px",
                  padding:"7px 10px", background:"#fff", outline:"none",
                  color:"#0d0d14" }} />
              <button style={{ fontFamily:"var(--sans)", fontSize:"11px",
                fontWeight:600, background:"#052962", color:"#fff",
                border:"none", borderRadius:"2px", padding:"7px 12px",
                cursor:"pointer", whiteSpace:"nowrap" }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOOKING STRIP ─────────────────────────────────────── */}
      <BookingStrip />

      {/* ── MORE STORIES ──────────────────────────────────────── */}
      {stories.length > 0 && (
        <div style={{ background:"#f7f6f2", padding:"24px 20px" }}>
          {/* Section header */}
          <div style={{ display:"flex", alignItems:"center", gap:"14px",
            marginBottom:"20px", paddingBottom:"12px",
            borderBottom:"2px solid #052962" }}>
            <h2 style={{ fontFamily:"var(--serif)", fontSize:"1.2rem",
              fontWeight:900, color:"#0d0d14", letterSpacing:"-.3px" }}>
              More from today
            </h2>
            <div style={{ flex:1, height:"1px", background:"#dedbd4" }} />
            <span style={{ fontFamily:"var(--sans)", fontSize:"10px", color:"#a8a8b2" }}>
              {new Date().toLocaleDateString("en-US",
                { weekday:"long", month:"long", day:"numeric" })}
            </span>
          </div>

          {/* Story rows */}
          <div style={{ background:"#fff", padding:"0 20px" }}>
            {stories.map((p, i) => (
              <StoryRow key={p.id} post={p} num={i + 1} />
            ))}
          </div>

          {/* Ad slot */}
          <div style={{
            marginTop:"20px", minHeight:"80px",
            background:"#efede8", border:"1px dashed #dedbd4",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"var(--sans)", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase", color:"#a8a8b2",
          }}>
            Advertisement
          </div>
        </div>
      )}
    </div>
  );
}
