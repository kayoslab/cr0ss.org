export const runtime = "edge";

import { NextResponse } from "next/server";
import { ZBodyProfileUpsert } from "@/lib/db/validation";
import { getBodyProfileDB, upsertBodyProfileDB } from "@/lib/db/profile";
import { revalidateDashboard } from "@/lib/cache/revalidate";

function assertSecret(req: Request) {
  const secret = new Headers(req.headers).get("x-vercel-revalidation-key");
  if (secret !== process.env.DASHBOARD_API_SECRET) {
    throw new Response(JSON.stringify({ message: "Invalid secret" }), { status: 401 });
  }
}

export async function GET() {
  try {
    const p = await getBodyProfileDB();
    return NextResponse.json(p, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    assertSecret(req);
    const body = await req.json();
    const parsed = ZBodyProfileUpsert.parse(body);
    const updated = await upsertBodyProfileDB(parsed);
    revalidateDashboard(); // caffeine curve depends on body params
    return NextResponse.json({ ok: true, profile: updated }, { status: 200 });
  } catch (e: any) {
    const status = e?.status ?? 400;
    try {
      const msg = typeof e === "object" && e?.message ? e.message : String(e);
      return NextResponse.json({ message: msg }, { status });
    } catch {
      return NextResponse.json({ message: "Bad Request" }, { status });
    }
  }
}
