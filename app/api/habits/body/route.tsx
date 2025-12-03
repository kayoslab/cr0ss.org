export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { NextResponse } from "next/server";
import { ZBodyProfileUpsert } from "@/lib/db/validation";
import { getBodyProfileDB, upsertBodyProfileDB } from "@/lib/db/profile";
import { revalidateCoffee } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { HTTP_STATUS } from "@/lib/constants/http";
import { RATE_LIMITS } from "@/lib/rate/config";

// GET current body profile
export const GET = wrapTrace("GET /api/habits/body", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-body", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const p = await getBodyProfileDB();
    return NextResponse.json(p, { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { message?: string };
    return NextResponse.json({ message: error?.message ?? "Failed" }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
});

// POST update body profile (partial or full)
export const POST = wrapTrace("POST /api/habits/body", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-body", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return new Response("Too many requests", {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const body = await req.json();
    const result = ZBodyProfileUpsert.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: result.error.flatten() },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const updated = await upsertBodyProfileDB(result.data);
    revalidateCoffee();
    return NextResponse.json({ ok: true, profile: updated }, { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const error = e as { status?: number; message?: string };
    const status = error?.status ?? HTTP_STATUS.BAD_REQUEST;
    try {
      const msg = typeof e === "object" && error?.message ? error.message : String(e);
      return NextResponse.json({ message: msg }, { status });
    } catch {
      return NextResponse.json({ message: "Bad Request" }, { status });
    }
  }
});
