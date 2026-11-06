import { describe, it, expect } from "vitest";
import { calculatePricing } from "../pricing/calculator";
import { PricingModel } from "../schemas/pricing";

describe("ProCost Pricing Invariants & Dual Quotes", () => {
  it("calculates base costs, markup, discount, and tax accurately with BigInt", () => {
    const model: PricingModel = {
      currency: "EGP",
      markupPercentage: 30, // 30% markup on cost
      discountMinor: BigInt(50000), // 500 EGP discount (50,000 Piastres)
      taxPercentage: 14, // 14% VAT
      items: [
        {
          id: "1",
          name: "إيجار كاميرا وعدسات",
          category: "gear",
          quantity: 1,
          unitCostMinor: BigInt(300000), // 3,000 EGP (300,000 Piastres)
          currency: "EGP",
        },
        {
          id: "2",
          name: "مساعد إضاءة",
          category: "crew",
          quantity: 2,
          unitCostMinor: BigInt(100000), // 1,000 EGP * 2 = 2,000 EGP (200,000 Piastres)
          currency: "EGP",
        },
      ],
    };

    const { internal, client } = calculatePricing(model);

    // Total base cost: 3,000 + 2,000 = 5,000 EGP (500,000 Piastres)
    expect(internal.totalBaseCostMinor).toBe(BigInt(500000));
    expect(internal.categoryTotalsMinor.gear).toBe(BigInt(300000));
    expect(internal.categoryTotalsMinor.crew).toBe(BigInt(200000));

    // Markup 30% on 5,000 EGP = 1,500 EGP (150,000 Piastres)
    expect(internal.markupAmountMinor).toBe(BigInt(150000));

    // Subtotal before discount: 5,000 + 1,500 = 6,500 EGP (650,000 Piastres)
    expect(internal.subtotalBeforeDiscountMinor).toBe(BigInt(650000));

    // After discount of 500 EGP (50,000 Piastres): taxable = 6,000 EGP (600,000 Piastres)
    expect(internal.taxableAmountMinor).toBe(BigInt(600000));

    // 14% VAT on 6,000 EGP = 840 EGP (84,000 Piastres)
    expect(internal.taxAmountMinor).toBe(BigInt(84000));

    // Total client price: 6,000 + 840 = 6,840 EGP (684,000 Piastres)
    expect(internal.totalClientPriceMinor).toBe(BigInt(684000));
    expect(client.totalMinor).toBe(BigInt(684000));

    // Verify Client Quote does NOT expose internal cost fields
    expect(client.items[0].totalPriceMinor).toBe(BigInt(390000)); // 3,000 + 30% = 3,900 EGP
    expect(client.items[1].totalPriceMinor).toBe(BigInt(260000)); // 2,000 + 30% = 2,600 EGP
    expect((client as unknown as Record<string, unknown>).totalBaseCostMinor).toBeUndefined();
    expect((client as unknown as Record<string, unknown>).markupAmountMinor).toBeUndefined();
  });

  it("throws an error when currency mixing is attempted", () => {
    const invalidModel: PricingModel = {
      currency: "EGP",
      markupPercentage: 20,
      discountMinor: 0n,
      taxPercentage: 0,
      items: [
        {
          id: "1",
          name: "كاميرا",
          category: "gear",
          quantity: 1,
          unitCostMinor: BigInt(100000),
          currency: "EGP",
        },
        {
          id: "2",
          name: "عدسة مستوردة",
          category: "gear",
          quantity: 1,
          unitCostMinor: BigInt(5000),
          currency: "USD", // Illegal mixed currency!
        },
      ],
    };

    expect(() => calculatePricing(invalidModel)).toThrow(/خلط عملات غیر مسموح|خلط عملات/);
  });

  it("safely caps discounts so that total does not drop below zero", () => {
    const model: PricingModel = {
      currency: "SAR",
      markupPercentage: 0,
      discountMinor: BigInt(1000000), // Huge discount (10,000 SAR)
      taxPercentage: 15,
      items: [
        {
          id: "1",
          name: "جلسة تصوير",
          category: "other",
          quantity: 1,
          unitCostMinor: BigInt(200000), // 2,000 SAR
          currency: "SAR",
        },
      ],
    };

    const { internal } = calculatePricing(model);
    expect(internal.discountMinor).toBe(BigInt(200000)); // Capped at base subtotal
    expect(internal.taxableAmountMinor).toBe(0n);
    expect(internal.totalClientPriceMinor).toBe(0n);
  });
});
