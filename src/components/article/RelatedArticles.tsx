import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getCategoryMeta } from "@/lib/categories";

export async function RelatedArticles({
  currentSlug,
  category,
}: {
  currentSlug: string;
  category: string;
}) {
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, featured_image, category, labels, published_at")
    .eq("status", "published")
    .eq("category", category)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(3);

  if (!data || data.length === 0) return null;

  return (
    <section style={{ borderTop: "2px solid #052962", padding: "20px", marginTop: 0 }}>
      <h2 style={{ fontFamily: "sans-serif", fontSize: "11px", fontWeight: 500,
                   letterSpacing: "2px", textTransform: "uppercase", color: "#707070",
                   marginBottom: "16px" }}>
        Keep reading
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {data.map((p) => {
          const meta = getCategoryMeta(p.category);
          return (
            <Link key={p.id} href={`/posts/${p.slug}`}
              style={{ border: "1px solid #dcdcdc", borderRadius: "4px",
                       overflow: "hidden", display: "block", textDecoration: "none",
                       background: "#fff" }}>
              {p.featured_image ? (
                <div style={{ position: "relative", height: "110px" }}>
                  <Image src={p.featured_image} alt={p.title} fill
                    style={{ objectFit: "cover" }} sizes="200px" unoptimized />
                </div>
              ) : (
                <div style={{ height: "110px", background: "#f4f3ef" }} />
              )}
              <div style={{ padding: "10px 12px" }}>
                <span style={{ fontFamily: "sans-serif", fontSize: "9px", fontWeight: 700,
                               textTransform: "uppercase", letterSpacing: "1px",
                               color: meta.color, display: "block", marginBottom: "4px" }}>
                  {meta.label}
                </span>
                <span style={{ fontFamily: "Georgia, serif", fontSize: "13px",
                               fontWeight: 700, color: "#111118", lineHeight: 1.25,
                               display: "block" }}>
                  {p.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
