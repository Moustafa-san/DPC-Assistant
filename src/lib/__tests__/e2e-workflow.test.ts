import { describe, it, expect } from "vitest";
import { calculatePricing } from "../pricing/calculator";
import { calculateStorage } from "../storage-calc/calculator";
import { calculateSolarTimes } from "../solar/calculator";
import { computeInvoiceTotals, reconcileInvoiceWithPayments } from "../invoice/calculator";
import { createLedgerEntry, calculateRealizedIncome } from "../income/ledger";
import { calculateAssetDepreciation, calculateBuyVsRent, calculateStudioProfitability } from "../business/calculator";
import { generate3dLutCube } from "../palette/lut-generator";
import { generateSecureToken, hashToken } from "../tokens/crypto";
import { Invoice, Payment } from "../schemas/invoice";
import { ColorPalette } from "../schemas/palette";

describe("Gate 5 End-to-End Operational Backbone: «من البريف للفلوس»", () => {
  it("executes the complete, seamless workflow without double-counting", () => {
    // -------------------------------------------------------------------------
    // Step 1: Brief Builder & Public Cryptographic Share Link
    // -------------------------------------------------------------------------
    const { rawToken, tokenHash } = generateSecureToken(72);
    expect(rawToken.length).toBe(64);
    expect(hashToken(rawToken)).toBe(tokenHash);

    // -------------------------------------------------------------------------
    // Step 2: ProCost Smart Pricing & Dual Quotes
    // -------------------------------------------------------------------------
    const pricingResult = calculatePricing({
      currency: "EGP",
      markupPercentage: 35, // 35% Markup on cost
      discountMinor: 0n,
      taxPercentage: 14, // 14% VAT
      items: [
        {
          id: "crew-1",
          name: "طاقم التصوير",
          category: "crew",
          quantity: 1,
          unitCostMinor: BigInt(1200000), // 12,000 EGP
          currency: "EGP",
        },
        {
          id: "gear-1",
          name: "إيجار معدات سينمائية",
          category: "gear",
          quantity: 1,
          unitCostMinor: BigInt(600000), // 6,000 EGP
          currency: "EGP",
        },
        {
          id: "post-1",
          name: "مونتاج وألوان Cine Palette",
          category: "post_production",
          quantity: 1,
          unitCostMinor: BigInt(800000), // 8,000 EGP
          currency: "EGP",
        },
      ],
    });

    // Base cost: 12,000 + 6,000 + 8,000 = 26,000 EGP (2,600,000 Piastres)
    expect(pricingResult.internal.totalBaseCostMinor).toBe(BigInt(2600000));
    // Markup 35% on 26,000 EGP = 9,100 EGP (910,000 Piastres)
    expect(pricingResult.internal.markupAmountMinor).toBe(BigInt(910000));
    // Subtotal = 35,100 EGP (3,510,000 Piastres)
    expect(pricingResult.internal.subtotalBeforeDiscountMinor).toBe(BigInt(3510000));
    // 14% VAT on 35,100 EGP = 4,914 EGP (491,400 Piastres)
    expect(pricingResult.internal.taxAmountMinor).toBe(BigInt(491400));
    // Total Client Price = 40,014 EGP (4,001,400 Piastres)
    expect(pricingResult.internal.totalClientPriceMinor).toBe(BigInt(4001400));

    // Client Quote must match total and hide internal costs
    expect(pricingResult.client.totalMinor).toBe(BigInt(4001400));
    expect(pricingResult.client.items.length).toBe(3);

    // -------------------------------------------------------------------------
    // Step 3: Storage Calculator & Memory Cards Distribution
    // -------------------------------------------------------------------------
    const storageResult = calculateStorage({
      videoHours: 8,
      videoBitrateMbps: 50,
      photoCount: 1500,
      photoAverageSizeMB: 55,
      safetyMarginPercentage: 15,
      cameraCount: 2,
    });
    // Matches Gate 0 fixture: 508.9 GB
    expect(storageResult.totalRequiredStorageGb).toBe(508.9);
    expect(storageResult.recommendedCards.totalKitCapacityGb).toBeGreaterThanOrEqual(508.9);

    // -------------------------------------------------------------------------
    // Step 4: NOAA Solar Calculations for Cairo Shoot Date (2026-11-04)
    // -------------------------------------------------------------------------
    const solarResult = calculateSolarTimes(
      "2026-11-04",
      { latitude: 30.0444, longitude: 31.2357 },
      "Africa/Cairo"
    );
    expect(["06:11", "06:12", "06:13"]).toContain(solarResult.sunrise);
    expect(["17:04", "17:05", "17:06"]).toContain(solarResult.sunset);

    // -------------------------------------------------------------------------
    // Step 5: Cine Palette & 3D LUT (.cube) Export
    // -------------------------------------------------------------------------
    const weddingPalette: ColorPalette = {
      id: "pal-wedding-1",
      name: "Cairo_Golden_Hour",
      mood: "Warm Editorial",
      dominantColor: "#F6F2E9",
      secondaryColor: "#46513B",
      accentColor: "#A8875B",
    };
    const cubeLut = generate3dLutCube(weddingPalette, {
      title: "Cairo_Golden_Hour",
      size: 9,
      contrast: 1.1,
      saturation: 1.05,
      warmth: 0.2,
    });
    expect(cubeLut).toContain("LUT_3D_SIZE 9");

    // -------------------------------------------------------------------------
    // Step 6: Pro Invoice Creation with Atomic Sequencing
    // -------------------------------------------------------------------------
    const invoiceTotals = computeInvoiceTotals({
      items: [
        {
          description: "باقة التصوير والإنتاج السينمائي الكاملة",
          quantity: 1,
          unitPriceMinor: BigInt(3510000), // 35,100 EGP
        },
      ],
      discountMinor: 0n,
      taxPercentage: 14,
    });
    expect(invoiceTotals.totalMinor).toBe(BigInt(4001400));

    const invoice: Invoice = {
      id: "inv-2026-001",
      invoiceNumber: "INV-2026-001",
      ownerId: "user-1",
      projectId: "proj-1",
      clientId: "client-1",
      currency: "EGP",
      issueDate: "2026-11-01",
      dueDate: "2026-11-15",
      items: invoiceTotals.items,
      subtotalMinor: invoiceTotals.subtotalMinor,
      discountMinor: 0n,
      taxPercentage: 14,
      taxAmountMinor: invoiceTotals.taxAmountMinor,
      totalMinor: invoiceTotals.totalMinor,
      paidAmountMinor: 0n,
      balanceDueMinor: invoiceTotals.totalMinor,
      status: "issued",
    };

    // -------------------------------------------------------------------------
    // Step 7: Milestone Payment 1 (Deposit 15,000 EGP) -> Cash Ledger Recognition
    // -------------------------------------------------------------------------
    const depositPayment: Payment = {
      id: "pay-deposit-01",
      invoiceId: invoice.id,
      amountMinor: BigInt(1500000), // 15,000 EGP
      currency: "EGP",
      paidAt: "2026-11-01T14:00:00Z",
      method: "instapay",
      idempotencyKey: "idem-deposit-001",
    };

    const reconStep1 = reconcileInvoiceWithPayments(invoice, [depositPayment]);
    expect(reconStep1.reconciledInvoice.status).toBe("partially_paid");
    expect(reconStep1.reconciledInvoice.paidAmountMinor).toBe(BigInt(1500000));
    expect(reconStep1.reconciledInvoice.balanceDueMinor).toBe(BigInt(2501400));

    // Ledger only recognizes 15,000 EGP, NOT uncollected 40,014 EGP!
    const ledgerEntry1 = createLedgerEntry(depositPayment, reconStep1.reconciledInvoice);
    const realizedIncome1 = calculateRealizedIncome([ledgerEntry1], "EGP");
    expect(realizedIncome1).toBe(BigInt(1500000));

    // -------------------------------------------------------------------------
    // Step 8: Milestone Payment 2 (Final Balance 25,014 EGP) -> Full Settlement
    // -------------------------------------------------------------------------
    const finalPayment: Payment = {
      id: "pay-final-02",
      invoiceId: invoice.id,
      amountMinor: BigInt(2501400), // 25,014 EGP
      currency: "EGP",
      paidAt: "2026-11-05T18:00:00Z",
      method: "bank_transfer",
      idempotencyKey: "idem-final-002",
    };

    const reconStep2 = reconcileInvoiceWithPayments(invoice, [depositPayment, finalPayment]);
    expect(reconStep2.reconciledInvoice.status).toBe("paid");
    expect(reconStep2.reconciledInvoice.paidAmountMinor).toBe(BigInt(4001400));
    expect(reconStep2.reconciledInvoice.balanceDueMinor).toBe(0n);

    const ledgerEntry2 = createLedgerEntry(finalPayment, reconStep2.reconciledInvoice);
    const realizedIncome2 = calculateRealizedIncome([ledgerEntry1, ledgerEntry2], "EGP");
    expect(realizedIncome2).toBe(BigInt(4001400)); // Exactly 40,014 EGP without double counting!

    // -------------------------------------------------------------------------
    // Step 9: Business Dashboard Profitability & Investment Verification
    // -------------------------------------------------------------------------
    const depreciation = calculateAssetDepreciation({
      id: "cam-fx3",
      name: "Sony FX3",
      purchaseCostMinor: BigInt(6000000), // 60,000 EGP
      currency: "EGP",
      purchasedAt: "2026-01-01",
      expectedUsefulHours: 1000,
      usedHours: 250,
    });
    // Gate 0 fixture: 60 EGP/hour
    expect(depreciation.depreciationPerHourMinor).toBe(BigInt(6000));
    // Accumulated depreciation for 250 hours = 15,000 EGP
    expect(depreciation.accumulatedDepreciationMinor).toBe(BigInt(1500000));

    // Buy vs Rent break-even fixture: 50,000 / 2,000 = 25 days
    const buyVsRent = calculateBuyVsRent({
      purchasePriceMinor: BigInt(5000000),
      dailyRentalCostMinor: BigInt(200000),
      currency: "EGP",
      expectedDaysUsedPerYear: 30,
    });
    expect(buyVsRent.breakEvenDays).toBe(25);
    expect(buyVsRent.recommendation).toBe("buy");

    // Studio Profitability
    const studioProfit = calculateStudioProfitability({
      currency: "EGP",
      realizedIncomeMinor: realizedIncome2, // 40,014 EGP
      operatingExpensesMinor: BigInt(450000), // 4,500 EGP
      equipmentDepreciationMinor: depreciation.accumulatedDepreciationMinor, // 15,000 EGP
    });
    // Total expenses: 4,500 + 15,000 = 19,500 EGP (1,950,000 Piastres)
    expect(studioProfit.totalExpensesMinor).toBe(BigInt(1950000));
    // Net Profit: 40,014 - 19,500 = 20,514 EGP (2,051,400 Piastres)
    expect(studioProfit.netProfitMinor).toBe(BigInt(2051400));
    expect(studioProfit.isProfitable).toBe(true);
    expect(studioProfit.netProfitMarginPercentage).toBeGreaterThan(50);
  });
});
