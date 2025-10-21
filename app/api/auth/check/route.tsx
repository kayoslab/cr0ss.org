export const runtime = "edge";

import { NextResponse } from "next/server";
import { assertSecret } from "@/lib/auth/secret";

export async function GET(req: Request) {
  try {
    assertSecret(req);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}
