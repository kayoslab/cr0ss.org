export const runtime = "edge";

import { NextResponse } from "next/server";
import { assertSecret } from "@/lib/auth/secret";
import { HTTP_STATUS } from "@/lib/constants/http";

export async function GET(req: Request) {
  try {
    assertSecret(req);
    return NextResponse.json({ ok: true }, { status: HTTP_STATUS.OK });
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? HTTP_STATUS.UNAUTHORIZED;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}
