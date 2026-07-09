import { z } from "zod";

export const ZBrewMethod = z.enum([
  "espresso",
  "v60",
  "chemex",
  "moka",
  "aero",
  "cold_brew",
  "other"
]);
export type BrewMethod = z.infer<typeof ZBrewMethod>;

export const ZGoalKind = z.enum([
  "running_distance_km",
  "steps",
  "reading_minutes",
  "outdoor_minutes",
  "writing_minutes",
  "focus_minutes",
  "coding_minutes",
]);

// Morning Brew
export const ZBrewMethodsToday = z.array(z.object({ type: ZBrewMethod, count: z.number().int() }));

export const ZDayHabits = z.object({
  date: z.string(), // YYYY-MM-DD
  steps: z.number().int().min(0),
  reading_minutes: z.number().int().min(0),
  outdoor_minutes: z.number().int().min(0),
  writing_minutes: z.number().int().min(0),
  coding_minutes: z.number().int().min(0),
  focus_minutes: z.number().int().min(0).optional(),
});

export const ZConsistency = z.array(z.object(
  { 
    name: z.string(),
    kept: z.number().int().min(0),
    total: z.number().int().min(0) 
  }
));
export const ZTrendPoint = z.object({ 
  date: z.string(),
  writing_minutes: z.number().int().min(0),
  focus_minutes: z.number().int().min(0),
});
export const ZTrend = z.array(ZTrendPoint);

// Focus & Flow
export const ZScatterPoint = z.object({
  date: z.string(),
  sleep_score: z.number().int().min(0).max(100),
  focus_minutes: z.number().int().min(0),
});
export const ZScatter = z.array(ZScatterPoint);

export const ZBlocks = z.array(z.object({ date: z.string(), blocks: z.number().int().min(0) }));
export const ZStreak = z.object({ days: z.number().int().min(0) });

// Running
export const ZMonthlyProgress = z.object({
  month: z.string(), target_km: z.number(), total_km: z.number(), delta_km: z.number(),
  pct: z.number().min(0),
});
export const ZPacePoint = z.object({ date: z.string(), avg_pace_sec_per_km: z.number().int().min(0) });
export const ZPaceSeries = z.array(ZPacePoint);
export const ZHeatDay = z.object({ date: z.string(), km: z.number().min(0) });
export const ZHeat = z.array(ZHeatDay);

// Networking contact memory (vector search over people I meet)

/** How the visitor identified themselves on the portfolio capture form. */
export const ZAnchorType = z.enum(["linkedin", "company"]);
export type AnchorType = z.infer<typeof ZAnchorType>;

/** Lifecycle of an enrichment job for a captured contact. */
export const ZContactStatus = z.enum(["pending", "enriching", "enriched", "failed"]);
export type ContactStatus = z.infer<typeof ZContactStatus>;

/**
 * A seed row created by the public capture form.
 * `anchorValue` is a LinkedIn URL or a company name depending on `anchorType`.
 */
export const ZContactSeed = z.object({
  name: z.string().min(1).max(200),
  anchorType: ZAnchorType,
  anchorValue: z.string().min(1).max(500),
  message: z.string().max(1000).optional(),
  source: z.string().max(100).default("portfolio"),
});
export type ContactSeed = z.infer<typeof ZContactSeed>;

/**
 * Enriched profile stored as JSONB metadata alongside the embedding.
 * Known fields are typed; extra actor-specific fields are preserved via passthrough.
 */
export const ZProfileMetadata = z
  .object({
    name: z.string(),
    headline: z.string().optional(),
    company: z.string().optional(),
    role: z.string().optional(),
    location: z.string().optional(),
    linkedinUrl: z.string().optional(),
    email: z.string().optional(),
    metAt: z.string().optional(),      // Where/when we met, if known
    tags: z.array(z.string()).optional(),
  })
  .catchall(z.unknown());
export type ProfileMetadata = z.infer<typeof ZProfileMetadata>;

/** A single ranked result from a plain-English recall query. */
export const ZContactSearchResult = z.object({
  contactId: z.string(),
  name: z.string(),
  anchorType: ZAnchorType,
  anchorValue: z.string(),
  content: z.string(),
  profile: ZProfileMetadata,
  similarity: z.number().min(0).max(1),
});
export type ContactSearchResult = z.infer<typeof ZContactSearchResult>;