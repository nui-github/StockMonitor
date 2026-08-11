import { describe, expect, it } from "vitest";
import { calcHoldingPL } from "@/lib/services/portfolio-calc";

describe("calcHoldingPL", () => {
  it("computes gain when current price is above cost basis", () => {
    const pl = calcHoldingPL({ quantity: "10", costBasis: "100" }, 120);
    expect(pl.costValue).toBe(1000);
    expect(pl.currentValue).toBe(1200);
    expect(pl.pl).toBe(200);
    expect(pl.plPct).toBe(20);
  });

  it("computes loss when current price is below cost basis", () => {
    const pl = calcHoldingPL({ quantity: "5", costBasis: "200" }, 150);
    expect(pl.costValue).toBe(1000);
    expect(pl.currentValue).toBe(750);
    expect(pl.pl).toBe(-250);
    expect(pl.plPct).toBe(-25);
  });

  it("handles fractional quantity (decimal string precision)", () => {
    const pl = calcHoldingPL({ quantity: "0.5", costBasis: "300.12345678" }, 310);
    expect(pl.costValue).toBeCloseTo(150.061728, 5);
    expect(pl.currentValue).toBe(155);
  });

  it("returns 0% instead of NaN/Infinity when cost basis is zero", () => {
    const pl = calcHoldingPL({ quantity: "10", costBasis: "0" }, 50);
    expect(pl.plPct).toBe(0);
    expect(Number.isFinite(pl.plPct)).toBe(true);
  });

  it("break-even yields zero pl", () => {
    const pl = calcHoldingPL({ quantity: "3", costBasis: "50" }, 50);
    expect(pl.pl).toBe(0);
    expect(pl.plPct).toBe(0);
  });
});
