export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export type SupportedCurrency = "EGP" | "USD" | "SAR" | "AED";

export interface Money {
  amountMinor: bigint;
  currency: SupportedCurrency;
}

export interface ExchangeRateSnapshot {
  baseCurrency: SupportedCurrency;
  quoteCurrency: SupportedCurrency;
  rate: number;
  source: string;
  observedAt: string; // ISO 8601 UTC
}

export type ProjectStatus = "draft" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "void";
