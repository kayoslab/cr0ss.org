/**
 * API endpoint for correlation discovery
 *
 * GET /api/insights/correlations
 * Returns discovered correlations between quantified self metrics
 *
 * Query parameters:
 * - days: Number of days to analyze (default: 90)
 * - pValueThreshold: Max p-value for significance (default: 0.1)
 * - minAbsR: Minimum absolute correlation coefficient (default: 0.3)
 */

import { NextRequest } from "next/server";
import { discoverCorrelations } from "@/lib/insights/correlation-discovery";
import { apiSuccess, internalError } from "@/lib/api/responses";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const days = parseInt(searchParams.get("days") || "90", 10);
    const pValueThreshold = parseFloat(
      searchParams.get("pValueThreshold") || "0.1"
    );
    const minAbsR = parseFloat(searchParams.get("minAbsR") || "0.3");

    // Validate parameters
    if (days < 7 || days > 365) {
      return Response.json(
        { error: "days must be between 7 and 365" },
        { status: 400 }
      );
    }

    if (pValueThreshold < 0 || pValueThreshold > 1) {
      return Response.json(
        { error: "pValueThreshold must be between 0 and 1" },
        { status: 400 }
      );
    }

    if (minAbsR < 0 || minAbsR > 1) {
      return Response.json(
        { error: "minAbsR must be between 0 and 1" },
        { status: 400 }
      );
    }

    // Discover correlations
    const correlations = await discoverCorrelations({
      days,
      pValueThreshold,
      minAbsR,
    });

    return apiSuccess({
      correlations,
      count: correlations.length,
      parameters: {
        days,
        pValueThreshold,
        minAbsR,
      },
    });
  } catch (error) {
    console.error("Error discovering correlations:", error);
    return internalError(
      "Failed to discover correlations",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
