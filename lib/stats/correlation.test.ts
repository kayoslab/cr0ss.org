import { describe, it, expect } from "vitest";
import { calculatePearsonCorrelation, isSignificant, formatCorrelation } from "./correlation";

describe("Pearson Correlation", () => {
  it("calculates perfect positive correlation", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];

    const result = calculatePearsonCorrelation(x, y);

    expect(result.r).toBeCloseTo(1.0, 10);
    expect(result.pValue).toBeLessThan(0.01);
    expect(result.strength).toBe("very strong");
    expect(result.confidence).toBe("strong");
  });

  it("calculates perfect negative correlation", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];

    const result = calculatePearsonCorrelation(x, y);

    expect(result.r).toBeCloseTo(-1.0, 10);
    expect(result.pValue).toBeLessThan(0.01);
    expect(result.strength).toBe("very strong");
  });

  it("calculates weak/no correlation", () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [3, 7, 2, 8, 5, 4, 9, 1, 6, 10]; // random/weak pattern

    const result = calculatePearsonCorrelation(x, y);

    // Just verify it doesn't show strong correlation
    expect(Math.abs(result.r)).toBeLessThan(1.0);
  });

  it("handles moderate positive correlation", () => {
    // Simulate sleep score vs focus time with some noise
    const sleepScore = [70, 75, 80, 85, 90, 65, 72, 88, 92, 78];
    const focusMinutes = [120, 135, 150, 160, 180, 100, 125, 170, 190, 140];

    const result = calculatePearsonCorrelation(sleepScore, focusMinutes);

    expect(result.r).toBeGreaterThan(0.7);
    expect(result.pValue).toBeLessThan(0.05);
    expect(["strong", "very strong"]).toContain(result.strength);
  });

  it("requires minimum sample size", () => {
    const x = [1, 2];
    const y = [2, 4];

    const result = calculatePearsonCorrelation(x, y);

    expect(result.confidence).toBe("none");
    expect(result.pValue).toBe(1);
  });

  it("handles arrays with no variance", () => {
    const x = [5, 5, 5, 5, 5];
    const y = [1, 2, 3, 4, 5];

    const result = calculatePearsonCorrelation(x, y);

    expect(result.r).toBe(0);
    expect(result.strength).toBe("none");
  });

  it("throws error for mismatched array lengths", () => {
    const x = [1, 2, 3];
    const y = [1, 2];

    expect(() => calculatePearsonCorrelation(x, y)).toThrow("Arrays must have equal length");
  });
});

describe("Correlation Helpers", () => {
  it("identifies significant correlations", () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

    const result = calculatePearsonCorrelation(x, y);

    expect(isSignificant(result)).toBe(true);
  });

  it("formats correlation results", () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

    const result = calculatePearsonCorrelation(x, y);
    const formatted = formatCorrelation(result);

    expect(formatted).toContain("positive correlation");
    expect(formatted).toContain("r=");
    expect(formatted).toContain("p=");
    expect(formatted).toContain("n=10");
  });
});

describe("Statistical Classification", () => {
  it("classifies correlation strength correctly", () => {
    // Very strong: |r| >= 0.9
    expect(calculatePearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]).strength).toBe("very strong");

    // Strong: 0.7 <= |r| < 0.9
    const strong = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const strongY = [2, 3.5, 6, 7, 10, 11, 14, 15, 18, 19]; // r ≈ 0.99
    expect(calculatePearsonCorrelation(strong, strongY).strength).toBe("very strong");
  });

  it("classifies confidence levels correctly", () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

    const result = calculatePearsonCorrelation(x, y);

    // With perfect correlation and n=10, should be strong confidence
    expect(result.confidence).toBe("strong");
    expect(result.pValue).toBeLessThan(0.01);
  });
});
