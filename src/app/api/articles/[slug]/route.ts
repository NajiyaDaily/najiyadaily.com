import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-publish-secret")
               ?? req.headers.get("x-admin-secret");
  return secret === process.env.REVALIDATE_SECRET
      || secret === process.env.ADMIN_SECRET;
}

type Props = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Props) {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", params.slug)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article: data });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (body.status === "published" && !body.published_at) {
    body.published_at = new Date().toISOString();
  }
  const { data, error } = await supabaseAdmin
    .from("articles")
    .update(body)
    .eq("slug", params.slug)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/posts/${params.slug}`);
  revalidatePath("/");
  return NextResponse.json({ article: data });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabaseAdmin
    .from("articles")
    .delete()
    .eq("slug", params.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  return NextResponse.json({ deleted: true });
}
