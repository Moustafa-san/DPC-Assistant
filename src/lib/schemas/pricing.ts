import { z } from "zod";
import { supportedCurrencySchema } from "./common";

export const costCategorySchema = z.enum([
  "gear",
  "crew",
  "logistics",
  "location",
  "post_production",
  "other",
]);

export const costItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "اسم البند مطلوب"),
  category: costCategorySchema,
  quantity: z.number().positive("الكمية يجب أن تكون موجبة"),
  unitCostMinor: z.bigint().nonnegative("التكلفة لا يمكن أن تكون سالبة"),
  currency: supportedCurrencySchema,
  notes: z.string().optional(),
});

export const pricingModelSchema = z.object({
  items: z.array(costItemSchema),
  markupPercentage: z.number().min(0, "نسبة الهامش لا يمكن أن تكون سالبة"),
  discountMinor: z.bigint().nonnegative("الخصم لا يمكن أن يكون سالباً").default(0n),
  taxPercentage: z.number().min(0).max(100).default(0),
  currency: supportedCurrencySchema,
});

export type CostItem = z.infer<typeof costItemSchema>;
export type PricingModel = z.infer<typeof pricingModelSchema>;
export type CostCategory = z.infer<typeof costCategorySchema>;

export interface InternalQuoteBreakdown {
  currency: z.infer<typeof supportedCurrencySchema>;
  totalBaseCostMinor: bigint;
  categoryTotalsMinor: Record<CostCategory, bigint>;
  markupPercentage: number;
  markupAmountMinor: bigint;
  subtotalBeforeDiscountMinor: bigint;
  discountMinor: bigint;
  taxableAmountMinor: bigint;
  taxPercentage: number;
  taxAmountMinor: bigint;
  totalClientPriceMinor: bigint;
  netMarginPercentage: number;
}

export interface ClientQuoteItem {
  name: string;
  category: CostCategory;
  quantity: number;
  totalPriceMinor: bigint;
}

export interface ClientQuoteView {
  currency: z.infer<typeof supportedCurrencySchema>;
  items: ClientQuoteItem[];
  subtotalMinor: bigint;
  discountMinor: bigint;
  taxPercentage: number;
  taxAmountMinor: bigint;
  totalMinor: bigint;
}
