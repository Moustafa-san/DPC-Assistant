import {
  PricingModel,
  InternalQuoteBreakdown,
  ClientQuoteView,
  CostCategory,
} from "../schemas/pricing";

/**
 * Calculates internal and client pricing breakdowns strictly using integer minor units.
 * Prevents currency mixing and floating point drift.
 */
export function calculatePricing(model: PricingModel): {
  internal: InternalQuoteBreakdown;
  client: ClientQuoteView;
} {
  const { items, markupPercentage, discountMinor, taxPercentage, currency } = model;

  // Invariant 1: All items must match model currency
  for (const item of items) {
    if (item.currency !== currency) {
      throw new Error(
        `خلط عملات غير مسموح: البند "${item.name}" بعملة ${item.currency} يختلف عن عملة النموذج ${currency}`
      );
    }
  }

  const categoryTotalsMinor: Record<CostCategory, bigint> = {
    gear: 0n,
    crew: 0n,
    logistics: 0n,
    location: 0n,
    post_production: 0n,
    other: 0n,
  };

  let totalBaseCostMinor = 0n;

  for (const item of items) {
    const itemTotalCost = item.unitCostMinor * BigInt(Math.round(item.quantity));
    categoryTotalsMinor[item.category] += itemTotalCost;
    totalBaseCostMinor += itemTotalCost;
  }

  // Calculate markup: markup is markup on cost (1 + markupPercentage / 100)
  // To avoid float issues with BigInt, we scale: (totalBaseCostMinor * BigInt(Math.round(markupPercentage * 100))) / 10000n
  const markupFactorScaled = BigInt(Math.round(markupPercentage * 100));
  const markupAmountMinor = (totalBaseCostMinor * markupFactorScaled) / 10000n;

  const subtotalBeforeDiscountMinor = totalBaseCostMinor + markupAmountMinor;

  // Invariant: discount cannot exceed subtotal
  const effectiveDiscountMinor =
    discountMinor > subtotalBeforeDiscountMinor ? subtotalBeforeDiscountMinor : discountMinor;

  const taxableAmountMinor = subtotalBeforeDiscountMinor - effectiveDiscountMinor;

  // Tax calculation
  const taxFactorScaled = BigInt(Math.round(taxPercentage * 100));
  const taxAmountMinor = (taxableAmountMinor * taxFactorScaled) / 10000n;

  const totalClientPriceMinor = taxableAmountMinor + taxAmountMinor;

  // Net margin percentage calculation for internal review
  const netProfitMinor = totalClientPriceMinor - totalBaseCostMinor - taxAmountMinor;
  const netMarginPercentage =
    totalClientPriceMinor > 0n
      ? Number((netProfitMinor * 10000n) / totalClientPriceMinor) / 100
      : 0;

  const internal: InternalQuoteBreakdown = {
    currency,
    totalBaseCostMinor,
    categoryTotalsMinor,
    markupPercentage,
    markupAmountMinor,
    subtotalBeforeDiscountMinor,
    discountMinor: effectiveDiscountMinor,
    taxableAmountMinor,
    taxPercentage,
    taxAmountMinor,
    totalClientPriceMinor,
    netMarginPercentage,
  };

  // Generate Client Quote (sanitized, markup distributed per item, internal costs hidden)
  // Scaling each item price by (1 + markupPercentage / 100)
  const clientItems = items.map((item) => {
    const itemBaseCost = item.unitCostMinor * BigInt(Math.round(item.quantity));
    const itemMarkup = (itemBaseCost * markupFactorScaled) / 10000n;
    const itemTotalPriceMinor = itemBaseCost + itemMarkup;

    return {
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      totalPriceMinor: itemTotalPriceMinor,
    };
  });

  const client: ClientQuoteView = {
    currency,
    items: clientItems,
    subtotalMinor: subtotalBeforeDiscountMinor,
    discountMinor: effectiveDiscountMinor,
    taxPercentage,
    taxAmountMinor,
    totalMinor: totalClientPriceMinor,
  };

  return { internal, client };
}
