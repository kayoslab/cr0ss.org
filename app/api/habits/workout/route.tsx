export const runtime = "edge";

import { rateLimit } from "@/lib/rate/limit";
import { wrapTrace } from "@/lib/obs/trace";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/middleware";
import { ZWorkoutUpsert } from "@/lib/db/validation";
import { revalidateWorkouts } from "@/lib/cache/revalidate";
import { assertSecret } from "@/lib/auth/secret";
import { insertWorkoutDB, getRecentWorkoutsDB, getWorkoutsByTypeDB } from "@/lib/db/workouts";
import { RATE_LIMITS } from "@/lib/rate/config";

export const GET = wrapTrace("GET /api/habits/workout", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "get-workout", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return createErrorResponse(
        "Too many requests",
        429,
        undefined,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const url = new URL(req.url);
    const workoutType = url.searchParams.get("type");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const workouts = workoutType
      ? await getWorkoutsByTypeDB(workoutType, limit)
      : await getRecentWorkoutsDB(limit);

    return createSuccessResponse(workouts);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401, undefined, "UNAUTHORIZED");
    }
    console.error("GET /api/habits/workout failed:", err);
    const error = err as { message?: string };
    return createErrorResponse(
      "Failed to fetch workouts",
      500,
      process.env.NODE_ENV === "development" ? error?.message : undefined,
      "INTERNAL_ERROR"
    );
  }
});

// POST add one or more new workouts
export const POST = wrapTrace("POST /api/habits/workout", async (req: Request) => {
  try {
    assertSecret(req);

    const rl = await rateLimit(req, "post-workout", RATE_LIMITS.HABITS);
    if (!rl.ok) {
      return createErrorResponse(
        "Too many requests",
        429,
        undefined,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    const parsed = [];
    for (const item of items) {
      const result = ZWorkoutUpsert.safeParse(item);
      if (!result.success) {
        return createErrorResponse(
          "Validation failed",
          400,
          result.error.flatten(),
          "VALIDATION_ERROR"
        );
      }
      parsed.push(result.data);
    }

    const inserted = [];
    for (const workout of parsed) {
      const result = await insertWorkoutDB(workout);
      inserted.push(result);
    }

    revalidateWorkouts();
    return createSuccessResponse(
      { ok: true, inserted: inserted.length, workouts: inserted },
      200
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401, undefined, "UNAUTHORIZED");
    }
    console.error("POST /api/habits/workout failed:", err);
    const error = err as { message?: string };
    return createErrorResponse(
      "Failed to create workout",
      500,
      process.env.NODE_ENV === "development" ? error?.message : undefined,
      "INTERNAL_ERROR"
    );
  }
});
