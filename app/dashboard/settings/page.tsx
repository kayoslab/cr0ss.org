import "server-only";

import React from "react";
import SettingsClient from "./settings.client";
import { dashboardApi } from "@/lib/api/client";
import type { CoffeeConfigResponse } from "@/lib/api/types";

// Use nodejs runtime for environment variable access
export const runtime = "nodejs";

export default async function SettingsPage() {
  const { items } = await dashboardApi.get<CoffeeConfigResponse>("/settings/coffee", {
    params: { page: 1, limit: 20 },
    tags: ["dashboard:settings:coffee"],
    revalidate: 3600, // 1 hour
  });

  return <SettingsClient coffees={items} />;
}
