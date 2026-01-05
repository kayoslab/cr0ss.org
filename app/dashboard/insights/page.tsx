/**
 * Insights Dashboard Page
 *
 * Displays discovered correlations between quantified self metrics.
 * Uses shadcn/ui components for consistent styling.
 */

import { Suspense } from "react";
import { InsightsList } from "@/components/insights/insights-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Use nodejs runtime for environment variable access
export const runtime = "nodejs";

// Force dynamic rendering to fetch data on-demand from API
// API endpoints handle caching with tag-based invalidation
export const dynamic = 'force-dynamic';

// Use ISR (Incremental Static Regeneration) with 15-minute cache
// Cache is immediately invalidated via revalidatePath() when data changes
export const revalidate = 900; // 15 minutes

export const metadata = {
  title: "Insights | cr0ss.org",
  description: "Discover correlations in the quantified self data",
};

function InsightsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function InsightsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Insights</h2>
        <p className="text-muted-foreground">
          Discover statistically significant correlations in the quantified self data
        </p>
      </div>

      <div className="space-y-6">

        {/* Info Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">How It Works</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This correlation engine analyzes the daily metrics to find meaningful patterns.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Statistical Analysis:</strong> Uses Pearson correlation coefficient (r)
              to measure the strength and direction of relationships between metrics.
            </p>
            <p>
              <strong>Confidence Levels:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
              <li><strong>Strong</strong> (p &lt; 0.01): 99% confidence the correlation is real</li>
              <li><strong>Moderate</strong> (p &lt; 0.05): 95% confidence</li>
              <li><strong>Exploratory</strong> (p &lt; 0.1): 90% confidence</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Correlation does not imply causation. These insights show <em>associations</em>
              between metrics, not cause-and-effect relationships.
            </p>
          </CardContent>
        </Card>

        {/* Insights List */}
        <Suspense fallback={<InsightsLoading />}>
          <InsightsList />
        </Suspense>
      </div>
    </div>
  );
}
