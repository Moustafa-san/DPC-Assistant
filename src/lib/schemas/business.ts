import { z } from "zod";
import { supportedCurrencySchema } from "./common";

export const assetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "اسم المعدة مطلوب"),
  purchaseCostMinor: z.bigint().positive("تكلفة الشراء يجب أن تكون موجبة"),
  currency: supportedCurrencySchema,
  purchasedAt: z.string(),
  expectedUsefulHours: z.number().positive("عدد ساعات التشغيل المتوقعة يجب أن يكون موجباً"),
  usedHours: z.number().min(0).default(0),
});

export const buyVsRentInputSchema = z.object({
  purchasePriceMinor: z.bigint().positive(),
  dailyRentalCostMinor: z.bigint().positive(),
  currency: supportedCurrencySchema,
  expectedDaysUsedPerYear: z.number().min(0),
});

export type Asset = z.infer<typeof assetSchema>;
export type BuyVsRentInput = z.infer<typeof buyVsRentInputSchema>;

export interface DepreciationResult {
  depreciationPerHourMinor: bigint;
  accumulatedDepreciationMinor: bigint;
  remainingBookValueMinor: bigint;
  isFullyDepreciated: boolean;
}

export interface BuyVsRentResult {
  breakEvenDays: number;
  recommendation: "buy" | "rent" | "neutral";
  annualRentalCostMinor: bigint;
  differenceMinor: bigint;
  reasonAr: string;
}

export interface StudioProfitabilityInput {
  realizedIncomeMinor: bigint;
  operatingExpensesMinor: bigint;
  equipmentDepreciationMinor: bigint;
  currency: z.infer<typeof supportedCurrencySchema>;
}

export interface StudioProfitabilityResult {
  currency: z.infer<typeof supportedCurrencySchema>;
  realizedIncomeMinor: bigint;
  totalExpensesMinor: bigint;
  netProfitMinor: bigint;
  netProfitMarginPercentage: number;
  isProfitable: boolean;
}
