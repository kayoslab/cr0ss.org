/**
 * Shared chart color constants for the dashboard
 * Using OKLCH color space for better perceptual uniformity
 */
export const CHART_COLOR_VALUES = [
  "oklch(0.646 0.222 41.116)",   // chart-1: orange
  "oklch(0.6 0.118 184.704)",     // chart-2: cyan
  "oklch(0.398 0.07 227.392)",    // chart-3: blue
  "oklch(0.828 0.189 84.429)",    // chart-4: yellow
  "oklch(0.769 0.188 70.08)",     // chart-5: peach
  "oklch(0.55 0.22 330)",          // chart-6: pink
  "oklch(0.65 0.18 150)",          // chart-7: teal
  "oklch(0.7 0.15 270)",           // chart-8: purple
  "oklch(0.6 0.2 50)",             // chart-9: gold
  "oklch(0.5 0.18 200)",           // chart-10: blue
] as const;

export function getChartColor(index: number): string {
  return CHART_COLOR_VALUES[index % CHART_COLOR_VALUES.length];
}
