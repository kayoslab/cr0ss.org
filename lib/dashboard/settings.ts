/**
 * Reference data for the settings page (coffee catalogue from Contentful).
 */
import { z } from 'zod';
import { cached } from '@/lib/cache/cached';
import { tags, CACHE_LIFE } from '@/lib/cache/tags';
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

export const getCoffeeConfig = cached(
  'dashboard-settings-coffee',
  queryCoffeeConfig,
  {
    tags: () => [tags.dashboard.settingsCoffee, tags.content.coffee],
    revalidate: CACHE_LIFE.stable,
  }
);
