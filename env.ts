import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ALGOLIA_APP_ID: z.string().length(10),
    ALGOLIA_ADMIN_KEY: z.string().min(20),
    ALGOLIA_SEARCH_KEY: z.string().min(20),
    ALGOLIA_INDEX: z.string().min(1),
    CONTENTFUL_SPACE_ID: z.string().length(12),
    CONTENTFUL_ACCESS_TOKEN: z.string().length(43),
    CONTENTFUL_REVALIDATE_SECRET: z.string().min(20),
    CONTENTFUL_INDEX_SECRET: z.string().min(20),
    LOCATION_API_SECRET: z.string().min(20),
    DASHBOARD_API_SECRET: z.string().min(20),
  },
  client: {},
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  // runtimeEnv: {
  //   CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
  //   CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_ACCESS_TOKEN,
  //   CONTENTFUL_REVALIDATE_SECRET: process.env.CONTENTFUL_REVALIDATE_SECRET,
  // },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
    ALGOLIA_ADMIN_KEY: process.env.ALGOLIA_ADMIN_KEY,
    ALGOLIA_SEARCH_KEY: process.env.ALGOLIA_SEARCH_KEY,
    ALGOLIA_INDEX: process.env.ALGOLIA_INDEX,
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
    CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_ACCESS_TOKEN,
    CONTENTFUL_REVALIDATE_SECRET: process.env.CONTENTFUL_REVALIDATE_SECRET,
    CONTENTFUL_INDEX_SECRET: process.env.CONTENTFUL_INDEX_SECRET,
    LOCATION_API_SECRET: process.env.LOCATION_API_SECRET,
    DASHBOARD_API_SECRET: process.env.DASHBOARD_API_SECRET,
  }
});