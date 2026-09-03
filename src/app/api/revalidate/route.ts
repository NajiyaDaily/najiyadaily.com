import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  try {
    revalidatePath("/");
    revalidatePath("/category/[slug]", "page");
    revalidatePath("/posts/[slug]", "page");
    return NextResponse.json({ revalidated: true, ts: Date.now() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
