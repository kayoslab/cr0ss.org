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

// AI Chat Embeddings
export const ZEmbeddingSource = z.enum(["blog", "knowledge"]);
export type EmbeddingSource = z.infer<typeof ZEmbeddingSource>;

export const ZEmbeddingMetadata = z.object({
  source: ZEmbeddingSource,
  slug: z.string().optional(),      // For blog posts
  title: z.string().optional(),     // For blog posts
  file: z.string().optional(),      // For knowledge base files
  url: z.string().optional(),       // Full URL if applicable
});
export type EmbeddingMetadata = z.infer<typeof ZEmbeddingMetadata>;

export const ZChatEmbedding = z.object({
  id: z.number().int(),
  content: z.string(),
  embedding: z.array(z.number()).length(384).optional(), // Vector as array (text-embedding-3-small, truncated to 384 dims)
  metadata: ZEmbeddingMetadata,
  created_at: z.string(),
  updated_at: z.string(),
});
export type ChatEmbedding = z.infer<typeof ZChatEmbedding>;

export const ZRetrievalResult = z.object({
  content: z.string(),
  metadata: ZEmbeddingMetadata,
  similarity: z.number().min(0).max(1),
});
export type RetrievalResult = z.infer<typeof ZRetrievalResult>;