import React from "react";
import { SECRET_HEADER } from "@/lib/auth/constants";
import { isoToBerlinDate } from "@/lib/time/berlin";
import CoffeeClient from "./coffee.client";

// Use edge runtime to match the API route
export const runtime = "edge";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Coffee & Caffeine | Dashboard",
  description: "Track your coffee consumption and caffeine intake",
};

// ---- absolute URL builder + server fetcher
function resolveBaseUrl() {
  // On Vercel, VERCEL_URL contains the actual deployment domain (www.cr0ss.org in production)
  // This avoids redirect issues when NEXT_PUBLIC_SITE_URL points to preview deployments
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) {
    return vercel.startsWith('http') ? vercel : `https://${vercel}`;
  }

  // Fallback to public site URL (for local dev or other environments)
  const pub = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (pub) return pub;

  return "http://localhost:3000";
}

type JRes<T> = { ok: true; data: T } | { ok: false; status: number; error?: string };
async function jfetchServer<T>(path: string, retries = 2): Promise<JRes<T>> {
  const base = resolveBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers = new Headers({ accept: "application/json" });
  const secret = process.env.DASHBOARD_API_SECRET as string;
  headers.set(SECRET_HEADER, secret);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, cache: "no-store" });

      if (res.ok) {
        return { ok: true, data: (await res.json()) as T };
      }

      const errorBody = await res.text();

      if (res.status === 401 && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        continue;
      }

      return { ok: false, status: res.status, error: errorBody };
    } catch (error) {
      if (attempt === retries) {
        return { ok: false, status: 500, error: error instanceof Error ? error.message : 'Network error' };
      }
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }

  return { ok: false, status: 500, error: 'Max retries exceeded' };
}

type DashboardApi = {
  cupsToday: number;
  brewMethodsToday: { type: string; count: number }[];
  coffeeOriginThisWeek: { name: string; value: number }[];
  caffeineSeries: { timeISO: string; intake_mg: number; body_mg: number }[];
};

export default async function CoffeePage() {
  const apiRes = await jfetchServer<DashboardApi>("/api/dashboard");
  if (!apiRes.ok) {
    throw new Error(`Failed to load dashboard data (HTTP ${apiRes.status}): ${apiRes.error || 'Unknown error'}`);
  }
  const api = apiRes.data;

  // --- Map caffeine series to chart format (Berlin time labels)
  const caffeineDual = api.caffeineSeries.map((p) => ({
    time: isoToBerlinDate(Date.parse(p.timeISO)),
    intake_mg: p.intake_mg,
    body_mg: p.body_mg,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Coffee & Caffeine</h2>
        <p className="text-muted-foreground">
          Track your coffee consumption, brewing methods, and caffeine levels throughout the day.
        </p>
      </div>

      <CoffeeClient
        cupsToday={api.cupsToday}
        methodsBar={api.brewMethodsToday.map((b) => ({ name: b.type, value: b.count }))}
        originsDonut={api.coffeeOriginThisWeek}
        caffeineDual={caffeineDual}
      />
    </div>
  );
}
