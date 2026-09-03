import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getCategoryMeta } from "@/lib/categories";

export async function RelatedArticles({
  currentSlug, category
}: { currentSlug: string; category: string }) {
  const { data } = await supabase
    .from("articles")
    .select("id,slug,title,featured_image,category,labels,published_at")
    .eq("status","published")
    .eq("category", category)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(3);

  if (!data || data.length === 0) return null;

  return (
    <section className="border-t-2 border-navy px-5 md:px-8 py-8 max-w-[800px] mx-auto">
      <h2 className="font-sans text-[11px] font-bold tracking-[2px] uppercase text-nd-muted mb-5">
        Keep Reading
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((p) => {
          const meta = getCategoryMeta(p.category);
          return (
            <Link key={p.id} href={`/posts/${p.slug}`}
              className="group border border-nd-border rounded-md overflow-hidden
                         hover:border-navy hover:-translate-y-0.5 transition-all bg-white">
              {p.featured_image ? (
                <div className="relative h-[110px]">
                  <Image src={p.featured_image} alt={p.title}
                    fill className="object-cover" sizes="200px" unoptimized/>
                </div>
              ) : <div className="h-[110px] bg-paper"/>}
              <div className="p-3">
                <span className="font-sans text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: meta.color }}>{meta.label}</span>
                <h3 className="font-serif text-[0.88rem] font-bold leading-snug text-nd-ink
                               group-hover:text-navy transition-colors mt-1 line-clamp-3">
                  {p.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
