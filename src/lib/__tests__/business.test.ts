import { describe, it, expect } from "vitest";
import {
  calculateAssetDepreciation,
  calculateBuyVsRent,
  calculateStudioProfitability,
} from "../business/calculator";
import { Asset } from "../schemas/business";

describe("Business Dashboard Metrics & Gate 0 Fixtures", () => {
  it("matches Fixture: Equipment depreciation of 60,000 EGP over 1,000 hours = 60 EGP/hour", () => {
    const cameraAsset: Asset = {
      id: "asset-sony-fx3",
      name: "Sony FX3 Cinema Camera",
      purchaseCostMinor: BigInt(6000000), // 60,000 EGP (6,000,000 Piastres)
      currency: "EGP",
      purchasedAt: "2026-01-01",
      expectedUsefulHours: 1000,
      usedHours: 250, // 250 hours used so far
    };

    const result = calculateAssetDepreciation(cameraAsset);

    // Depreciation per hour = 60 EGP (6,000 Piastres)
    expect(result.depreciationPerHourMinor).toBe(BigInt(6000));

    // Accumulated depreciation for 250 hours = 250 * 60 = 15,000 EGP (1,500,000 Piastres)
    expect(result.accumulatedDepreciationMinor).toBe(BigInt(1500000));

    // Remaining book value = 60,000 - 15,000 = 45,000 EGP (4,500,000 Piastres)
    expect(result.remainingBookValueMinor).toBe(BigInt(4500000));
    expect(result.isFullyDepreciated).toBe(false);
  });

  it("matches Fixture: Buy vs Rent break-even analysis = 25 days", () => {
    // Lens cost: 50,000 EGP purchase, 2,000 EGP/day rental
    const result = calculateBuyVsRent({
      purchasePriceMinor: BigInt(5000000), // 50,000 EGP
      dailyRentalCostMinor: BigInt(200000), // 2,000 EGP
      currency: "EGP",
      expectedDaysUsedPerYear: 30, // Shoots 30 days a year
    });

    expect(result.breakEvenDays).toBe(25);
    expect(result.recommendation).toBe("buy");
    expect(result.reasonAr).toContain("يُنصح بالشراء");
  });

  it("recommends rental when annual usage is below the break-even threshold", () => {
    const result = calculateBuyVsRent({
      purchasePriceMinor: BigInt(5000000), // 50,000 EGP
      dailyRentalCostMinor: BigInt(200000), // 2,000 EGP
      currency: "EGP",
      expectedDaysUsedPerYear: 10, // Only 10 days
    });

    expect(result.breakEvenDays).toBe(25);
    expect(result.recommendation).toBe("rent");
    expect(result.reasonAr).toContain("يُنصح بالتأجير");
  });

  it("computes studio profitability and margin accurately on cash basis", () => {
    const result = calculateStudioProfitability({
      currency: "EGP",
      realizedIncomeMinor: BigInt(10000000), // 100,000 EGP
      operatingExpensesMinor: BigInt(3000000), // 30,000 EGP (studio, assistants, transport)
      equipmentDepreciationMinor: BigInt(1000000), // 10,000 EGP
    });

    // Total expenses: 30,000 + 10,000 = 40,000 EGP (4,000,000 Piastres)
    expect(result.totalExpensesMinor).toBe(BigInt(4000000));

    // Net profit = 100,000 - 40,000 = 60,000 EGP (6,000,000 Piastres)
    expect(result.netProfitMinor).toBe(BigInt(6000000));

    // Margin = (60,000 / 100,000) * 100 = 60%
    expect(result.netProfitMarginPercentage).toBe(60);
    expect(result.isProfitable).toBe(true);
  });
});
