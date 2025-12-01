import React from "react";
import { SECRET_HEADER } from "@/lib/auth/constants";
import WorkoutsClient from "./workouts.client";

// Use edge runtime to match the API route
export const runtime = "edge";

// fetch settings
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Workouts | Dashboard",
  description: "Track your workouts and running activity",
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

type JRes<T> = { ok: true; data: T } | { ok: false; status: number };
async function jfetchServer<T>(path: string, retries = 2): Promise<JRes<T>> {
  const base = resolveBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers = new Headers({ accept: "application/json" });
  const secret = process.env.DASHBOARD_API_SECRET;
  headers.set(SECRET_HEADER, secret);

  // Log outgoing request details
  console.log('[Workouts] Making fetch request:', {
    url,
    hasSecret: !!secret,
    secretPrefix: secret?.slice(0, 4),
    secretSuffix: secret?.slice(-4),
    headerName: SECRET_HEADER,
    headerValue: headers.get(SECRET_HEADER)?.slice(0, 4) + '...' + headers.get(SECRET_HEADER)?.slice(-4),
    allHeaders: Array.from(headers.keys()),
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        return { ok: true, data: (await res.json()) as T };
      }

      // If it's a 401, log details and retry if possible
      if (res.status === 401) {
        const errorBody = await res.text();
        console.error(`[Workouts] 401 Unauthorized (attempt ${attempt + 1}/${retries + 1}):`, {
          url,
          hasSecret: !!secret,
          secretLength: secret?.length,
          errorBody,
        });

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
          continue;
        }
      }

      return { ok: false, status: res.status };
    } catch (error) {
      if (attempt === retries) {
        console.error('[Workouts] Fetch error:', error);
        return { ok: false, status: 500 };
      }
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }

  return { ok: false, status: 500 };
}

type DashboardApi = {
  runningProgress: { target_km: number; total_km: number; delta_km: number; pct: number; month: string };
  paceSeries: { date: string; avg_pace_sec_per_km: number }[];
  runningHeatmap: { date: string; km: number }[];
  workoutHeatmap: { date: string; duration_min: number; workouts: { type: string; duration_min: number }[] }[];
  workoutTypes: string[];
  workoutStats: { workout_type: string; count: number; total_duration_min: number; total_distance_km: number }[];
  sleepPrevCaff: { date: string; sleep_score: number; prev_caffeine_mg: number; prev_day_workout: boolean }[];
};

export default async function WorkoutsPage() {
  // usage
  const apiRes = await jfetchServer<DashboardApi>("/api/dashboard");
  if (!apiRes.ok) throw new Error(`Failed to load dashboard data (HTTP ${apiRes.status})`);
  const api = apiRes.data;

  // Calculate workout streak (simplified - could be moved to API)
  const calculateStreak = (heatmap: typeof api.workoutHeatmap) => {
    let current = 0;
    let longest = 0;
    let streak = 0;

    // Sort by date descending
    const sorted = [...heatmap].sort((a, b) => b.date.localeCompare(a.date));

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].duration_min > 0) {
        streak++;
        if (i === 0) current = streak;
        longest = Math.max(longest, streak);
      } else {
        if (i === 0) current = 0;
        streak = 0;
      }
    }

    return { current, longest };
  };

  // Calculate personal records (simplified)
  const calculatePersonalRecords = () => {
    const runningWorkouts = api.workoutHeatmap
      .flatMap(day => day.workouts.filter(w => w.type === 'running'))
      .filter(w => w.duration_min > 0);

    if (runningWorkouts.length === 0) return undefined;

    // For now, return placeholder - would need actual distance data
    return {
      longestRun: { distance_km: 15.2, date: "2024-11-15" },
      fastestPace: { pace_min_per_km: 4.8, date: "2024-11-20" },
    };
  };

  const streaks = calculateStreak(api.workoutHeatmap);
  const personalRecords = calculatePersonalRecords();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workouts</h2>
        <p className="text-muted-foreground">
          Track your workout sessions, training progress, and personal records.
        </p>
      </div>

      <WorkoutsClient
        workoutTypes={api.workoutTypes}
        workoutStats={api.workoutStats}
        workoutHeatmap={api.workoutHeatmap}
        currentStreak={streaks.current}
        longestStreak={streaks.longest}
        personalRecords={personalRecords}
      />
    </div>
  );
}
