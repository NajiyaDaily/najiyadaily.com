import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-publish-secret") || req.nextUrl.searchParams.get("secret");
  return secret === process.env.REVALIDATE_SECRET;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const status   = searchParams.get("status") || "published";
  const limit    = parseInt(searchParams.get("limit") || "10");
  const offset   = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("articles")
    .select("*")
    .eq("status", status)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data || [] });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert(body)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ article: data }, { status: 201 });
}
