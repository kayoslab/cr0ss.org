/**
 * Statistical Correlation Analysis
 *
 * Implements Pearson correlation coefficient and significance testing
 * for discovering relationships between quantified self metrics.
 *
 * References:
 * - Pearson's r: https://en.wikipedia.org/wiki/Pearson_correlation_coefficient
 * - t-distribution: https://en.wikipedia.org/wiki/Student%27s_t-distribution
 */

export interface CorrelationResult {
  r: number; // Pearson correlation coefficient (-1 to 1)
  pValue: number; // Statistical significance (0 to 1)
  n: number; // Sample size
  confidence: "strong" | "moderate" | "exploratory" | "none";
  strength: "very strong" | "strong" | "moderate" | "weak" | "very weak" | "none";
}

/**
 * Calculate Pearson correlation coefficient between two variables
 * @param x First variable values
 * @param y Second variable values
 * @returns Correlation result with r, p-value, and interpretation
 */
export function calculatePearsonCorrelation(
  x: number[],
  y: number[]
): CorrelationResult {
  if (x.length !== y.length) {
    throw new Error("Arrays must have equal length");
  }

  const n = x.length;

  if (n < 3) {
    // Need at least 3 data points for meaningful correlation
    return {
      r: 0,
      pValue: 1,
      n,
      confidence: "none",
      strength: "none",
    };
  }

  // Calculate means
  const meanX = mean(x);
  const meanY = mean(y);

  // Calculate Pearson's r
  let numerator = 0;
  let sumSquaresX = 0;
  let sumSquaresY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSquaresX += dx * dx;
    sumSquaresY += dy * dy;
  }

  const denominator = Math.sqrt(sumSquaresX * sumSquaresY);

  if (denominator === 0) {
    // No variance in one or both variables
    return {
      r: 0,
      pValue: 1,
      n,
      confidence: "none",
      strength: "none",
    };
  }

  const r = numerator / denominator;

  // Calculate p-value using t-distribution
  const pValue = calculatePValue(r, n);

  return {
    r,
    pValue,
    n,
    confidence: classifyConfidence(pValue),
    strength: classifyStrength(r),
  };
}

/**
 * Calculate p-value for Pearson correlation using t-distribution
 * @param r Pearson correlation coefficient
 * @param n Sample size
 * @returns p-value (probability that correlation occurred by chance)
 */
function calculatePValue(r: number, n: number): number {
  if (n < 3) return 1;
  if (Math.abs(r) === 1) return 0;

  // Calculate t-statistic
  const df = n - 2; // degrees of freedom
  const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);

  // Two-tailed p-value using t-distribution
  return 2 * (1 - tDistributionCDF(Math.abs(t), df));
}

/**
 * Cumulative distribution function for Student's t-distribution
 * Uses approximation for computational efficiency
 */
function tDistributionCDF(t: number, df: number): number {
  // Special cases
  if (t === 0) return 0.5;
  if (df === 1) return 0.5 + Math.atan(t) / Math.PI;
  if (df === 2) return 0.5 + (t / (2 * Math.sqrt(2 + t * t)));

  // For larger df, use approximation via beta distribution
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;

  // Incomplete beta function approximation
  const betaCDF = incompleteBeta(x, a, b);

  return t > 0 ? 1 - betaCDF / 2 : betaCDF / 2;
}

/**
 * Incomplete beta function using continued fraction approximation
 * Used for t-distribution CDF calculation
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use symmetry relation if needed
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - incompleteBeta(1 - x, b, a);
  }

  // Continued fraction approximation
  const lbeta = logBeta(a, b);
  const front = Math.exp(
    Math.log(x) * a + Math.log(1 - x) * b - lbeta
  ) / a;

  let f = 1;
  let c = 1;
  let d = 0;

  for (let i = 0; i <= 200; i++) {
    const m = i / 2;

    let numerator;
    if (i === 0) {
      numerator = 1;
    } else if (i % 2 === 0) {
      numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    } else {
      numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    }

    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;

    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    const cd = c * d;
    f *= cd;

    if (Math.abs(1 - cd) < 1e-8) {
      return front * (f - 1);
    }
  }

  return front * (f - 1);
}

/**
 * Log beta function
 */
function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/**
 * Log gamma function using Lanczos approximation
 */
function logGamma(x: number): number {
  const g = 7;
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - logGamma(1 - x);
  }

  x -= 1;
  let a = coef[0];
  for (let i = 1; i < g + 2; i++) {
    a += coef[i] / (x + i);
  }

  const t = x + g + 0.5;
  return Math.log(2 * Math.PI) / 2 + Math.log(a) - t + (x + 0.5) * Math.log(t);
}

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Classify confidence level based on p-value
 * - Strong: p < 0.01 (99% confidence)
 * - Moderate: p < 0.05 (95% confidence)
 * - Exploratory: p < 0.1 (90% confidence)
 * - None: p >= 0.1
 */
function classifyConfidence(
  pValue: number
): "strong" | "moderate" | "exploratory" | "none" {
  if (pValue < 0.01) return "strong";
  if (pValue < 0.05) return "moderate";
  if (pValue < 0.1) return "exploratory";
  return "none";
}

/**
 * Classify correlation strength based on |r|
 * Based on Cohen's standard for behavioral sciences
 */
function classifyStrength(
  r: number
): "very strong" | "strong" | "moderate" | "weak" | "very weak" | "none" {
  const abs_r = Math.abs(r);
  if (abs_r >= 0.9) return "very strong";
  if (abs_r >= 0.7) return "strong";
  if (abs_r >= 0.5) return "moderate";
  if (abs_r >= 0.3) return "weak";
  if (abs_r >= 0.1) return "very weak";
  return "none";
}

/**
 * Helper function to check if correlation is statistically significant
 */
export function isSignificant(result: CorrelationResult): boolean {
  return result.pValue < 0.05;
}

/**
 * Helper function to format correlation for display
 */
export function formatCorrelation(result: CorrelationResult): string {
  const direction = result.r > 0 ? "positive" : "negative";
  return `${result.strength} ${direction} correlation (r=${result.r.toFixed(3)}, p=${result.pValue.toFixed(4)}, n=${result.n})`;
}
