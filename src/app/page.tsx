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

const CAT_COLORS: Record<string, string> = {
  "World": "#1546a0", "Tech": "#5a1d9a", "Culture": "#8b1a00",
  "Science": "#1a5e35", "Music": "#8b1a00", "Opinion": "#7a4000",
  "Travel": "#0d6e5e", "Daily-Paws": "#a0195a",
  "Morning": "#7a4000", "Afternoon": "#1a5e35", "Evening": "#3d1a7a",
};

function getCatColor(labels: string[]): string {
  for (const l of labels) {
    if (CAT_COLORS[l]) return CAT_COLORS[l];
  }
  return "#7a7a85";
}

function getPrimaryLabel(labels: string[]): string {
  const order = ["Daily-Paws","Travel","Morning","Afternoon","Evening",
                  "World","Tech","Culture","Science","Music","Opinion"];
  return order.find(function(l) { return labels.includes(l); }) || labels[0] || "News";
}

function formatLabel(label: string): string {
  if (label === "Daily-Paws") return "Daily Paws";
  return label;
}

function Eyebrow({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
      <div style={{ width: "3px", height: "14px", background: color, borderRadius: 0 }} />
      <span style={{
        fontFamily: "var(--sans)", fontSize: "10px", fontWeight: 500,
        letterSpacing: ".5px", color: color, textTransform: "uppercase",
      }}>
        {formatLabel(label)}
      </span>
    </div>
  );
}

function FeatureCard({ post }: { post: ArticleRow }) {
  const primary = getPrimaryLabel(post.labels);
  const color   = getCatColor(post.labels);
  return (
    <div style={{ background: "#fff" }}>
      <Link href={"/posts/" + post.slug}>
        {post.featured_image ? (
          <div style={{ position: "relative", width: "100%", height: "280px", overflow: "hidden" }}>
            <Image src={post.featured_image} alt={post.title}
              fill style={{ objectFit: "cover" }} priority unoptimized />
          </div>
        ) : (
          <div style={{ width: "100%", height: "280px", background: "#c5cfe8",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "80px",
                           fontWeight: 900, color: "#052962", opacity: 0.1 }}>ND</span>
          </div>
        )}
      </Link>
      <div style={{ padding: "18px 20px" }}>
        <Eyebrow label={primary} color={color} />
        <Link href={"/posts/" + post.slug}>
          <h2 style={{
            fontFamily: "var(--serif)", fontSize: "22px", fontWeight: 900,
            color: "#111118", lineHeight: 1.13, letterSpacing: "-.3px", marginBottom: "10px",
          }}>
            {post.title}
          </h2>
        </Link>
        {post.standfirst && (
          <p style={{
            fontSize: "12.5px", color: "#3a3a42", lineHeight: 1.65,
            fontStyle: "italic", marginBottom: "12px",
          }}>
            {post.standfirst}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: "10px", color: "#7a7a85" }}>
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-US",
                  { month: "short", day: "numeric", year: "numeric" })
              : ""}
          </span>
          <span style={{
            fontFamily: "var(--sans)", fontSize: "10px", color: "#7a7a85",
            display: "flex", alignItems: "center", gap: "3px",
          }}>
            <span style={{ width: "1px", height: "10px", background: "#e2e2de", display: "inline-block" }} />
            {post.read_time} min read
          </span>
        </div>
      </div>
    </div>
  );
}

function StackCard({ post }: { post: ArticleRow }) {
  const primary = getPrimaryLabel(post.labels);
  const color   = getCatColor(post.labels);
  return (
    <div style={{
      padding: "14px 16px", flex: 1, borderBottom: "1px solid #e2e2de",
      display: "flex", flexDirection: "column", gap: "6px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "2px", height: "11px", background: color, borderRadius: 0 }} />
        <span style={{
          fontFamily: "var(--sans)", fontSize: "9px", fontWeight: 500,
          letterSpacing: ".5px", textTransform: "uppercase", color: color,
        }}>
          {formatLabel(primary)}
        </span>
      </div>
      <Link href={"/posts/" + post.slug}>
        <div style={{
          fontFamily: "var(--serif)", fontSize: "13px", fontWeight: 700,
          color: "#111118", lineHeight: 1.25,
        }}>
          {post.title}
        </div>
      </Link>
      {post.excerpt && (
        <div style={{
          fontSize: "11px", color: "#7a7a85", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {post.excerpt}
        </div>
      )}
      <div style={{ fontFamily: "var(--sans)", fontSize: "9px", color: "#b0b0b8" }}>
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-US",
              { month: "short", day: "numeric" })
          : ""} · {post.read_time} min
      </div>
    </div>
  );
}

function StoryRow({ post, num }: { post: ArticleRow; num: number }) {
  const primary = getPrimaryLabel(post.labels);
  const color   = getCatColor(post.labels);
  const numStr  = num < 10 ? "0" + num : String(num);
  return (
    <div style={{
      display: "flex", gap: "14px", padding: "12px 0",
      borderBottom: "1px solid #e2e2de",
    }}>
      <div style={{
        fontFamily: "var(--serif)", fontSize: "28px", fontWeight: 900,
        color: "#e2e2de", lineHeight: 1, width: "28px", flexShrink: 0, paddingTop: "2px",
      }}>
        {numStr}
      </div>
      {post.featured_image && (
        <div style={{ width: "80px", height: "64px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
          <Image src={post.featured_image} alt={post.title}
            fill style={{ objectFit: "cover" }} sizes="80px" unoptimized />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <div style={{ width: "2px", height: "10px", background: color, borderRadius: 0 }} />
          <span style={{
            fontFamily: "var(--sans)", fontSize: "9px", fontWeight: 500,
            letterSpacing: ".5px", textTransform: "uppercase", color: color,
          }}>
            {formatLabel(primary)}
          </span>
        </div>
        <Link href={"/posts/" + post.slug}>
          <div style={{
            fontFamily: "var(--serif)", fontSize: "13.5px", fontWeight: 700,
            color: "#111118", lineHeight: 1.25, marginBottom: "4px",
          }}>
            {post.title}
          </div>
        </Link>
        {post.excerpt && (
          <div style={{ fontSize: "11px", color: "#7a7a85", lineHeight: 1.5 }}>
            {post.excerpt.slice(0, 120)}
          </div>
        )}
        <div style={{ fontFamily: "var(--sans)", fontSize: "9px", color: "#b0b0b8", marginTop: "5px" }}>
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString("en-US",
                { month: "short", day: "numeric", year: "numeric" })
            : ""} · {post.read_time} min read
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { data: posts } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  if (!posts || posts.length === 0) {
    return (
      <div style={{
        maxWidth: "1300px", margin: "0 auto", background: "#fff",
        minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: "60px", fontWeight: 900,
                        color: "#e2e2de", marginBottom: "16px" }}>ND</div>
          <p style={{ fontFamily: "var(--sans)", fontSize: "13px", color: "#7a7a85" }}>
            First articles coming soon.
          </p>
        </div>
      </div>
    );
  }

  function rank(p: ArticleRow): number {
    if (p.labels.includes("Daily-Paws")) return 0;
    if (p.labels.includes("Travel"))     return 1;
    if (p.labels.includes("Morning"))    return 2;
    if (p.labels.includes("Afternoon"))  return 3;
    if (p.labels.includes("Evening"))    return 4;
    return 5;
  }

  const sorted = [...posts].sort(function(a, b) { return rank(a) - rank(b); });
  const feature = sorted[0];
  const stack   = sorted.slice(1, 4);
  const stories = sorted.slice(4);

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto" }}>

      {/* Feature zone */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 280px",
        background: "#fff", borderBottom: "1px solid #e2e2de",
      }}>
        <div style={{ borderRight: "1px solid #e2e2de" }}>
          {feature && <FeatureCard post={feature} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {stack.map(function(p) { return <StackCard key={p.id} post={p} />; })}

          {/* Booking widget */}
          <div style={{ padding: "14px 16px", borderTop: "1px solid #e2e2de" }}>
            <div style={{ background: "#ebf5eb", border: "1px solid #c8e6c9", borderRadius: "4px", padding: "12px" }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: "8px", fontWeight: 500,
                            letterSpacing: "2px", textTransform: "uppercase", color: "#2e7d32", marginBottom: "4px" }}>
                Travel Deals
              </div>
              <div style={{ fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                            color: "#111118", marginBottom: "8px" }}>
                Find your next hotel
              </div>
              <a href="https://www.booking.com/?aid=101867344" target="_blank" rel="noopener sponsored"
                style={{
                  display: "block", textAlign: "center", background: "#003580", color: "#fff",
                  fontFamily: "var(--sans)", fontSize: "10px", fontWeight: 500,
                  padding: "8px", borderRadius: "3px", textDecoration: "none",
                }}>
                Search on Booking.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Booking strip */}
      <div style={{
        background: "#052962", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}>
        <div style={{ fontFamily: "var(--sans)", color: "rgba(255,255,255,.8)", fontSize: "12px" }}>
          <strong style={{ color: "#fff", fontWeight: 500 }}>Travelling soon?</strong>{" "}
          Find hotels at the best rate — no extra cost to you.
        </div>
        <a href="https://www.booking.com/?aid=101867344" target="_blank" rel="noopener sponsored"
          style={{
            fontFamily: "var(--sans)", fontSize: "10px", fontWeight: 500,
            background: "#d4af37", color: "#052962", border: "none", borderRadius: "3px",
            padding: "7px 16px", cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none",
          }}>
          Search on Booking.com
        </a>
      </div>

      {/* More stories */}
      {stories.length > 0 && (
        <div style={{ padding: "20px", background: "#f7f7f5" }}>
          <div style={{
            display: "flex", alignItems: "baseline", gap: "12px",
            marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #e2e2de",
          }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "14px", fontWeight: 700, color: "#111118" }}>
              More from today
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e2e2de" }} />
            <span style={{ fontFamily: "var(--sans)", fontSize: "10px", color: "#b0b0b8" }}>
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
          {stories.map(function(p, i) {
            return <StoryRow key={p.id} post={p} num={i + 1} />;
          })}
        </div>
      )}

    </div>
  );
}
