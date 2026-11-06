import { z } from "zod";

export const localeSchema = z.enum(["ar", "en"]);

export const supportedCurrencySchema = z.enum(["EGP", "USD", "SAR", "AED"]);

export const moneySchema = z.object({
  amountMinor: z.bigint().nonnegative({ message: "المبلغ لا يمكن أن يكون سالباً" }),
  currency: supportedCurrencySchema,
});

export const exchangeRateSnapshotSchema = z.object({
  baseCurrency: supportedCurrencySchema,
  quoteCurrency: supportedCurrencySchema,
  rate: z.number().positive(),
  source: z.string().min(1),
  observedAt: z.string().datetime(),
});
