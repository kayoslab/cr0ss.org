import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  // Treat `FOO=""` as unset so optional integrations (Apify, Strava, ...)
  // can be left blank in Vercel without failing validation at build time.
  emptyStringAsUndefined: true,
  server: {
    ALGOLIA_APP_ID: z.string().length(10),
    ALGOLIA_ADMIN_KEY: z.string().min(20),
    ALGOLIA_SEARCH_KEY: z.string().min(20),
    ALGOLIA_INDEX: z.string().min(1),
    CONTENTFUL_SPACE_ID: z.string().length(12),
    CONTENTFUL_ACCESS_TOKEN: z.string().length(43),
    CONTENTFUL_REVALIDATE_SECRET: z.string().min(20),
    DASHBOARD_API_SECRET: z.string().min(20),
    // AI Gateway (Vercel AI)
    AI_GATEWAY_API_KEY: z.string().min(10).optional(),
    // Networking capture + enrichment (contact-memory system)
    OWNER_WHATSAPP: z.string().min(6).optional(), // international format, digits only
    APIFY_TOKEN: z.string().min(1).optional(),
    APIFY_ACTOR_ID: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(20).optional(),
    // Owner-only bearer for the MCP contact-search endpoint (Eve queries)
    MCP_BEARER_TOKEN: z.string().min(20).optional(),
    // Strava Integration (optional - only required if using Strava sync)
    STRAVA_CLIENT_ID: z.string().min(1).optional(),
    STRAVA_CLIENT_SECRET: z.string().min(1).optional(),
    STRAVA_WEBHOOK_VERIFY_TOKEN: z.string().min(20).optional(),
    TOKEN_ENCRYPTION_KEY: z.string().length(64).optional(),
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
    DASHBOARD_API_SECRET: process.env.DASHBOARD_API_SECRET,
    OWNER_WHATSAPP: process.env.OWNER_WHATSAPP,
    APIFY_TOKEN: process.env.APIFY_TOKEN,
    APIFY_ACTOR_ID: process.env.APIFY_ACTOR_ID,
    CRON_SECRET: process.env.CRON_SECRET,
    MCP_BEARER_TOKEN: process.env.MCP_BEARER_TOKEN,
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_WEBHOOK_VERIFY_TOKEN: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
  },
});
