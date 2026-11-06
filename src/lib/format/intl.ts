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
 * Converts major units to minor units (e.g. 60000 EGP -> 6000000 Piastres).
 */
export function majorToMinor(amountMajor: number, currency: SupportedCurrency = "EGP"): bigint {
  const divisor = CURRENCY_MINOR_DIVISORS[currency];
  return BigInt(Math.round(amountMajor * divisor));
}

/**
 * Safely parses user text input (e.g. "2500.50", "2500", "2500,50") directly into BigInt minor units.
 * ZERO floating-point operations (no parseFloat, no Math.round).
 */
export function parseInputToMinorUnits(inputStr: string): bigint {
  if (!inputStr || typeof inputStr !== "string") {
    return 0n;
  }

  const cleaned = inputStr.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`قيمة المبلغ غير صالحة: "${inputStr}". يرجى إدخال أرقام صحيحة أو مع كسر عشري (مثال: 2500 أو 2500.50)`);
  }

  const parts = cleaned.split(".");
  const wholePart = BigInt(parts[0]);

  if (parts.length === 1) {
    return wholePart * 100n;
  }

  const fractionStr = parts[1].padEnd(2, "0");
  const fractionPart = BigInt(fractionStr);

  return wholePart * 100n + fractionPart;
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
