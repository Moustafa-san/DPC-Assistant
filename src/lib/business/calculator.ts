import {
  Asset,
  DepreciationResult,
  BuyVsRentInput,
  BuyVsRentResult,
  StudioProfitabilityInput,
  StudioProfitabilityResult,
} from "../schemas/business";

/**
 * Calculates straight-line hourly depreciation of camera/video gear.
 * Formula: Depreciation Per Hour = Purchase Cost / Useful Lifetime Hours.
 */
export function calculateAssetDepreciation(asset: Asset): DepreciationResult {
  const { purchaseCostMinor, expectedUsefulHours, usedHours } = asset;

  const hoursBigInt = BigInt(Math.max(1, Math.round(expectedUsefulHours)));
  const depreciationPerHourMinor = purchaseCostMinor / hoursBigInt;

  const usedBigInt = BigInt(Math.round(usedHours));
  let accumulatedDepreciationMinor = depreciationPerHourMinor * usedBigInt;

  if (accumulatedDepreciationMinor > purchaseCostMinor) {
    accumulatedDepreciationMinor = purchaseCostMinor;
  }

  const remainingBookValueMinor = purchaseCostMinor - accumulatedDepreciationMinor;
  const isFullyDepreciated = remainingBookValueMinor === 0n;

  return {
    depreciationPerHourMinor,
    accumulatedDepreciationMinor,
    remainingBookValueMinor,
    isFullyDepreciated,
  };
}

/**
 * Calculates Buy vs. Rent financial break-even analysis for equipment acquisition.
 * Formula: Break-even days = Purchase Price / Daily Rental Rate.
 */
export function calculateBuyVsRent(input: BuyVsRentInput): BuyVsRentResult {
  const { purchasePriceMinor, dailyRentalCostMinor, expectedDaysUsedPerYear } = input;

  if (dailyRentalCostMinor <= 0n) {
    throw new Error("تكلفة الإيجار اليومي يجب أن تكون أكبر من الصفر");
  }

  // Break-even days (Float rounded to 1 decimal place)
  const breakEvenDays =
    Math.round((Number(purchasePriceMinor) / Number(dailyRentalCostMinor)) * 10) / 10;

  const annualDaysBigInt = BigInt(Math.round(expectedDaysUsedPerYear));
  const annualRentalCostMinor = dailyRentalCostMinor * annualDaysBigInt;

  const differenceMinor =
    purchasePriceMinor > annualRentalCostMinor
      ? purchasePriceMinor - annualRentalCostMinor
      : annualRentalCostMinor - purchasePriceMinor;

  let recommendation: "buy" | "rent" | "neutral" = "neutral";
  let reasonAr = "";

  if (expectedDaysUsedPerYear > breakEvenDays) {
    recommendation = "buy";
    reasonAr = `يُنصح بالشراء: استخدامك المتوقع (${expectedDaysUsedPerYear} يوم/سنة) يتجاوز نقطة التعادل (${breakEvenDays} يوم)، مما يجعله استثماراً أوفر على المدى الطويل.`;
  } else if (expectedDaysUsedPerYear < breakEvenDays) {
    recommendation = "rent";
    reasonAr = `يُنصح بالتأجير: استخدامك المتوقع (${expectedDaysUsedPerYear} يوم/سنة) أقل من نقطة التعادل (${breakEvenDays} يوم)، والتأجير يحافظ على سيولتك النقدية.`;
  } else {
    recommendation = "neutral";
    reasonAr = `نقطة تعادل متطابقة (${breakEvenDays} يوم). القرار يعتمد على توفر السيولة ومصاريف الصيانة.`;
  }

  return {
    breakEvenDays,
    recommendation,
    annualRentalCostMinor,
    differenceMinor,
    reasonAr,
  };
}

/**
 * Calculates studio operating profitability and profit margins on a Cash Basis.
 */
export function calculateStudioProfitability(
  input: StudioProfitabilityInput
): StudioProfitabilityResult {
  const {
    realizedIncomeMinor,
    operatingExpensesMinor,
    equipmentDepreciationMinor,
    currency,
  } = input;

  const totalExpensesMinor = operatingExpensesMinor + equipmentDepreciationMinor;
  const netProfitMinor = realizedIncomeMinor - totalExpensesMinor;

  const netProfitMarginPercentage =
    realizedIncomeMinor > 0n
      ? Number((netProfitMinor * 10000n) / realizedIncomeMinor) / 100
      : 0;

  return {
    currency,
    realizedIncomeMinor,
    totalExpensesMinor,
    netProfitMinor,
    netProfitMarginPercentage,
    isProfitable: netProfitMinor > 0n,
  };
}
