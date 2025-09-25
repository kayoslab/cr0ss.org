// app/dashboard/settings/page.tsx
import "server-only";
import React from "react";
import SettingsClient from "./settings.client";
import { getAllCoffee } from "@/lib/contentful/api/coffee";

// If you export these types from your Contentful layer, prefer importing them:
// import type { CoffeeCollection, CoffeeProps } from "@/lib/contentful/api/coffee-types";

// Minimal local types to avoid tight coupling (safe with your current shape)
type CoffeePropsLike = {
  sys?: { id?: string };
  id?: string;
  name?: string;
  roaster?: string;
};
type CoffeeCollectionLike = { items: CoffeePropsLike[] };

type CoffeeRow = { id: string; name: string; roaster: string };

export const dynamic = "force-dynamic"; // always fetch fresh from Contentful

export default async function SettingsPage() {
    // Get first page of 20 coffees
    const collection = (await getAllCoffee(1, 20)) as unknown as CoffeeCollectionLike;

    const items = Array.isArray(collection?.items) ? collection.items : [];

    const coffees: CoffeeRow[] = items.map((c) => ({
        id: String(c?.sys?.id ?? c?.id ?? ""),
        name: String(c?.name ?? ""),
        roaster: String(c?.roaster ?? ""),
    }));

return <SettingsClient coffees={coffees} />;
}
