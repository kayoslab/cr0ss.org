import React from "react";
import { SECRET_HEADER } from "@/lib/auth/constants";
import { isoToBerlinDate } from "@/lib/time/berlin";
import DashboardClient from "../dashboard.client";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Coffee & Caffeine | Dashboard",
  description: "Track your coffee consumption and caffeine intake",
};

// ---- absolute URL builder + server fetcher
function resolveBaseUrl() {
  const pub = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (pub) return pub;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

type JRes<T> = { ok: true; data: T } | { ok: false; status: number };
async function jfetchServer<T>(path: string): Promise<JRes<T>> {
  const base = resolveBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers = new Headers({ accept: "application/json" });
  const secret = process.env.DASHBOARD_API_SECRET || "";
  if (secret) headers.set(SECRET_HEADER, secret);
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: (await res.json()) as T };
}

type DashboardApi = {
  cupsToday: number;
  brewMethodsToday: { type: string; count: number }[];
  coffeeOriginThisWeek: { name: string; value: number }[];
  caffeineSeries: { timeISO: string; intake_mg: number; body_mg: number }[];
};

export default async function CoffeePage() {
  // usage
  const apiRes = await jfetchServer<DashboardApi>("/api/dashboard");
  if (!apiRes.ok) throw new Error(`Failed to load dashboard data (HTTP ${apiRes.status})`);
  const api = apiRes.data;

  // --- Map caffeine series to chart format (Berlin time labels)
  const caffeineDual = api.caffeineSeries.map((p) => ({
    time: isoToBerlinDate(Date.parse(p.timeISO)),
    intake_mg: p.intake_mg,
    body_mg: p.body_mg,
  }));

  const morning = {
    cupsToday: api.cupsToday,
    methodsBar: api.brewMethodsToday.map((b) => ({ name: b.type, value: b.count })),
    originsDonut: api.coffeeOriginThisWeek,
    caffeineDual,
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Coffee & Caffeine</h2>
        <p className="text-muted-foreground">
          Track your coffee consumption, brewing methods, and caffeine levels throughout the day.
        </p>
      </div>

      <DashboardClient
        travel={null}
        morning={morning}
        rituals={null}
        running={null}
        workouts={null}
        sleepPrevCaff={[]}
      />
    </div>
  );
}
