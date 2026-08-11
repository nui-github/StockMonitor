import { describe, expect, it } from "vitest";
import { checkAlertCondition } from "@/lib/services/alerts";

describe("checkAlertCondition", () => {
  it("price_above fires when price crosses at or above threshold", () => {
    expect(checkAlertCondition({ type: "price_above", value: 250 }, { price: 250, changePct: 0 })).toBe(true);
    expect(checkAlertCondition({ type: "price_above", value: 250 }, { price: 250.01, changePct: 0 })).toBe(true);
    expect(checkAlertCondition({ type: "price_above", value: 250 }, { price: 249.99, changePct: 0 })).toBe(false);
  });

  it("price_below fires when price crosses at or below threshold", () => {
    expect(checkAlertCondition({ type: "price_below", value: 200 }, { price: 200, changePct: 0 })).toBe(true);
    expect(checkAlertCondition({ type: "price_below", value: 200 }, { price: 199.99, changePct: 0 })).toBe(true);
    expect(checkAlertCondition({ type: "price_below", value: 200 }, { price: 200.01, changePct: 0 })).toBe(false);
  });

  it("pct_change fires on either direction once magnitude crosses threshold", () => {
    expect(checkAlertCondition({ type: "pct_change", value: 5 }, { price: 0, changePct: 5.5 })).toBe(true);
    expect(checkAlertCondition({ type: "pct_change", value: 5 }, { price: 0, changePct: -5.5 })).toBe(true);
    expect(checkAlertCondition({ type: "pct_change", value: 5 }, { price: 0, changePct: 4.9 })).toBe(false);
    expect(checkAlertCondition({ type: "pct_change", value: 5 }, { price: 0, changePct: -4.9 })).toBe(false);
  });

  it("pct_change threshold stored as negative still compares by magnitude", () => {
    expect(checkAlertCondition({ type: "pct_change", value: -5 }, { price: 0, changePct: 6 })).toBe(true);
  });
});
