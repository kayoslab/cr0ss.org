/**
 * Correlation Card Component
 *
 * Displays a single discovered correlation with visual indicators
 * for strength and statistical significance.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DiscoveredCorrelation } from "@/lib/insights/correlation-discovery";
import { ArrowRight, TrendingUp, TrendingDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CorrelationCardProps {
  correlation: DiscoveredCorrelation;
  onClick?: () => void;
}

export function CorrelationCard({ correlation, onClick }: CorrelationCardProps) {
  const { metricA, metricB, correlation: result, interpretation } = correlation;
  const isPositive = result.r > 0;

  // Color coding based on correlation strength (effect size)
  const strengthColors = {
    "very strong": "bg-purple-500/10 text-purple-700 border-purple-500/20",
    strong: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    moderate: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
    weak: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    "very weak": "bg-gray-400/10 text-gray-600 border-gray-400/20",
    none: "bg-gray-300/10 text-gray-500 border-gray-300/20",
  };

  // Confidence colors for tooltip/secondary display
  const confidenceColors = {
    strong: "text-green-600",
    moderate: "text-blue-600",
    exploratory: "text-yellow-600",
    none: "text-gray-600",
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${onClick ? "hover:border-primary" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="text-lg flex items-center gap-2">
              <span className="font-semibold">{metricA.label}</span>
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{metricB.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {metricA.description} • {metricB.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={strengthColors[result.strength]}>
              {result.strength}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="gap-1">
                    <Info className="h-3 w-3" />
                    r = {result.r.toFixed(3)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 text-xs">
                    <p><strong>Effect size (r):</strong> {result.r.toFixed(4)}</p>
                    <p><strong>Significance (p):</strong> {result.pValue.toFixed(4)}</p>
                    <p><strong>Confidence:</strong> {result.confidence}</p>
                    <p><strong>Sample size:</strong> {result.n}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {interpretation}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className={`font-medium ${confidenceColors[result.confidence]}`}>
            {result.confidence} confidence (p={result.pValue.toFixed(3)})
          </span>
          <span>•</span>
          <span>
            {result.n} data points
          </span>
          <span>•</span>
          <span>
            {correlation.dateRange.start} to {correlation.dateRange.end}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
