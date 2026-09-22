/**
 * Reference data for the settings page (coffee catalogue from Contentful).
 */
import { z } from 'zod';
import { cacheLife, cacheTag } from 'next/cache';
import { tags } from '@/lib/cache/tags';
import { getAllCoffeeDTO } from '@/lib/contentful/api/coffee';

export const CoffeeConfigSchema = z.object({
  items: z.array(
    z.object({ id: z.string(), name: z.string(), roaster: z.string() })
  ),
});
export type CoffeeConfig = z.infer<typeof CoffeeConfigSchema>;

async function queryCoffeeConfig(
  page: number,
  limit: number
): Promise<CoffeeConfig> {
  const { items } = await getAllCoffeeDTO(page, limit);
  return CoffeeConfigSchema.parse({ items });
}

export async function getCoffeeConfig(
  page: number,
  limit: number
): Promise<CoffeeConfig> {
  'use cache';
  cacheLife('stable');
  cacheTag(tags.dashboard.settingsCoffee, tags.content.coffee);
  return queryCoffeeConfig(page, limit);
}
