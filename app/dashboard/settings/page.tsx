import "server-only";

import React from "react";
import SettingsClient from "./settings.client";
import { dashboardApi } from "@/lib/api/client";
import type { CoffeeConfigResponse } from "@/lib/api/types";

// Use nodejs runtime for environment variable access
export const runtime = "nodejs";

// Force dynamic rendering to fetch data on-demand from API
// API endpoints handle caching with tag-based invalidation
export const dynamic = 'force-dynamic';

// Use ISR (Incremental Static Regeneration) with 1-hour cache
// Cache is immediately invalidated via revalidatePath() when data changes
export const revalidate = 3600; // 1 hour

export default async function SettingsPage() {
  const { items } = await dashboardApi.get<CoffeeConfigResponse>("/settings/coffee", {
    params: { page: 1, limit: 20 },
    tags: ["dashboard:settings:coffee"],
    revalidate: 3600, // 1 hour
  });

  return <SettingsClient coffees={items} />;
}
