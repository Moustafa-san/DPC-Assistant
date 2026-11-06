import { Locale, SupportedCurrency } from "../types/common";

const CURRENCY_MINOR_DIVISORS: Record<SupportedCurrency, number> = {
  EGP: 100, // 1 EGP = 100 Piastres
  USD: 100, // 1 USD = 100 Cents
  SAR: 100, // 1 SAR = 100 Halalas
  AED: 100, // 1 AED = 100 Fils
};

/**
 * Converts integer minor units to major units safely without float accumulation errors.
 */
export function minorToMajor(amountMinor: bigint, currency: SupportedCurrency): number {
  const divisor = CURRENCY_MINOR_DIVISORS[currency];
  return Number(amountMinor) / divisor;
}

/**
 * Converts major units to minor units (bigint) safely.
 */
export function majorToMinor(amountMajor: number, currency: SupportedCurrency): bigint {
  const divisor = CURRENCY_MINOR_DIVISORS[currency];
  return BigInt(Math.round(amountMajor * divisor));
}

/**
 * Formats a monetary amount using standard Intl.NumberFormat.
 * Uses latin numerals in Arabic for precise financial accounting and LTR clarity.
 */
export function formatMoney(
  amountMinor: bigint,
  currency: SupportedCurrency,
  locale: Locale = "ar"
): string {
  const major = minorToMajor(amountMinor, currency);
  const intlLocale = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/**
 * Formats a date using standard Intl.DateTimeFormat with IANA timezone.
 */
export function formatDate(
  dateIso: string,
  locale: Locale = "ar",
  timeZone: string = "Africa/Cairo"
): string {
  const date = new Date(dateIso);
  const intlLocale = locale === "ar" ? "ar-EG" : "en-US";
  
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(date);
}
