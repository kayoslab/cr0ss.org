export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { NextResponse } from "next/server";
import { ZBodyProfileUpsert } from "@/lib/db/validation";
import { getBodyProfileDB, upsertBodyProfileDB } from "@/lib/db/profile";
import { revalidateDashboard } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";

// GET current body profile
export const GET = wrapTrace("GET /api/habits/body", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-body", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const p = await getBodyProfileDB();
    return NextResponse.json(p, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message ?? "Failed" }, { status: 500 });
  }
});

// POST update body profile (partial or full)
export const POST = wrapTrace("POST /api/habits/body", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-body", { windowSec: 60, max: 10 });
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const body = await req.json();
    const result = ZBodyProfileUpsert.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await upsertBodyProfileDB(result.data);
    revalidateDashboard();
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
});
