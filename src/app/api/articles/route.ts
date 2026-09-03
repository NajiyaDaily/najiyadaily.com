// GET  /api/articles — list articles (with filters)
// POST /api/articles — create new article (from GitHub Actions)

import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-publish-secret")
               ?? req.nextUrl.searchParams.get("secret");
  return secret === process.env.REVALIDATE_SECRET;
}

// GET — public article list
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const status   = searchParams.get("status") ?? "published";
  const limit    = parseInt(searchParams.get("limit") ?? "10");
  const offset   = parseInt(searchParams.get("offset") ?? "0");

  let query = supabase
    .from("articles")
    .select("*")
    .eq("status", status)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ articles: data, total: count });
}

// POST — create article (called by GitHub Actions)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert({
      slug:           body.slug,
      title:          body.title,
      standfirst:     body.standfirst ?? null,
      category:       body.category,
      labels:         body.labels ?? [],
      status:         body.status ?? "draft",
      featured_image: body.featured_image ?? null,
      image_credit:   body.image_credit ?? null,
      word_count:     body.word_count ?? 0,
      read_time:      body.read_time ?? 1,
      published_at:   body.published_at ?? null,
      excerpt:        body.excerpt ?? null,
      explains:       body.explains ?? null,
      why_matters:    body.why_matters ?? null,
      takeaways:      body.takeaways ?? [],
      whats_next:     body.whats_next ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ article: data }, { status: 201 });
}
