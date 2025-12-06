import "server-only";

import React from "react";
import SettingsClient from "./settings.client";
import { getAllCoffeeDTO } from "@/lib/contentful/api/coffee";

// Use nodejs runtime for environment variable access
export const runtime = "nodejs";

// Force dynamic rendering (no static generation)
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { items } = await getAllCoffeeDTO(1, 20);
  return <SettingsClient coffees={items} />;
}
