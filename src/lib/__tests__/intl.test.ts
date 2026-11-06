import { describe, it, expect } from "vitest";
import { minorToMajor, majorToMinor, formatMoney, formatDate } from "../format/intl";

describe("Intl Monetary & Formatting Invariants", () => {
  it("converts minor units to major units accurately without floating point errors", () => {
    // 60,000 EGP = 6,000,000 Piastres
    const amountMinor = BigInt(6000000);
    expect(minorToMajor(amountMinor, "EGP")).toBe(60000);

    // 12.50 USD = 1250 Cents
    const usdMinor = BigInt(1250);
    expect(minorToMajor(usdMinor, "USD")).toBe(12.5);
  });

  it("converts major units to minor units accurately", () => {
    expect(majorToMinor(60000, "EGP")).toBe(BigInt(6000000));
    expect(majorToMinor(12.5, "USD")).toBe(BigInt(1250));
  });

  it("formats monetary values with correct currency and locale formatting", () => {
    const egpFormatted = formatMoney(BigInt(6000000), "EGP", "ar");
    expect(egpFormatted).toContain("60");

    const usdFormatted = formatMoney(BigInt(150000), "USD", "en");
    expect(usdFormatted).toContain("$1,500.00");
  });

  it("formats dates according to IANA timezone Africa/Cairo", () => {
    const formatted = formatDate("2026-11-04T12:00:00Z", "ar", "Africa/Cairo");
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
  });
});
