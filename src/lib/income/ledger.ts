import { Payment, Invoice, IncomeLedgerEntry } from "../schemas/invoice";
import { SupportedCurrency } from "../types/common";

/**
 * Creates an Income Ledger Entry from a verified payment.
 */
export function createLedgerEntry(payment: Payment, invoice: Invoice): IncomeLedgerEntry {
  if (payment.invoiceId !== invoice.id) {
    throw new Error(
      `معرف الفاتورة في الدفعة (${payment.invoiceId}) لا يطابق الفاتورة المستلمة (${invoice.id})`
    );
  }

  if (payment.currency !== invoice.currency) {
    throw new Error(
      `تعارض في العملات: الدفعة (${payment.currency}) والفاتورة (${invoice.currency})`
    );
  }

  return {
    id: `ledger-${payment.id}`,
    paymentId: payment.id,
    invoiceId: invoice.id,
    projectId: invoice.projectId,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    recognizedAt: payment.paidAt,
    idempotencyKey: payment.idempotencyKey,
  };
}

/**
 * Calculates total realized income from ledger entries for a specific currency.
 * Guarantees that only collected cash is counted as income (Cash Basis).
 */
export function calculateRealizedIncome(
  entries: IncomeLedgerEntry[],
  targetCurrency: SupportedCurrency
): bigint {
  const seenIdempotencyKeys = new Set<string>();
  let totalIncomeMinor = 0n;

  for (const entry of entries) {
    if (entry.currency !== targetCurrency) {
      continue; // Strict currency separation: do not sum different currencies!
    }

    if (seenIdempotencyKeys.has(entry.idempotencyKey)) {
      throw new Error(`قيد دخل مكرر بنفس مفتاح العملية: ${entry.idempotencyKey}`);
    }
    seenIdempotencyKeys.add(entry.idempotencyKey);

    totalIncomeMinor += entry.amountMinor;
  }

  return totalIncomeMinor;
}
