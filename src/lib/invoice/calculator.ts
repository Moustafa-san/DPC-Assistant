import { Invoice, Payment, InvoiceItem } from "../schemas/invoice";

export interface InvoiceTotalsInput {
  items: Array<{ description: string; quantity: number; unitPriceMinor: bigint }>;
  discountMinor?: bigint;
  taxPercentage?: number;
}

export interface InvoiceTotalsOutput {
  items: InvoiceItem[];
  subtotalMinor: bigint;
  discountMinor: bigint;
  taxPercentage: number;
  taxAmountMinor: bigint;
  totalMinor: bigint;
}

/**
 * Computes exact totals for an invoice using integer minor units.
 */
export function computeInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotalsOutput {
  const { items: rawItems, discountMinor = 0n, taxPercentage = 0 } = input;

  let subtotalMinor = 0n;
  const items: InvoiceItem[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i];
    const qtyBigInt = BigInt(Math.round(raw.quantity));
    const totalPriceMinor = raw.unitPriceMinor * qtyBigInt;
    subtotalMinor += totalPriceMinor;

    items.push({
      id: `item-${i + 1}`,
      description: raw.description,
      quantity: raw.quantity,
      unitPriceMinor: raw.unitPriceMinor,
      totalPriceMinor,
    });
  }

  const effectiveDiscountMinor = discountMinor > subtotalMinor ? subtotalMinor : discountMinor;
  const taxableAmountMinor = subtotalMinor - effectiveDiscountMinor;

  const taxFactorScaled = BigInt(Math.round(taxPercentage * 100));
  const taxAmountMinor = (taxableAmountMinor * taxFactorScaled) / 10000n;

  const totalMinor = taxableAmountMinor + taxAmountMinor;

  return {
    items,
    subtotalMinor,
    discountMinor: effectiveDiscountMinor,
    taxPercentage,
    taxAmountMinor,
    totalMinor,
  };
}

/**
 * Reconciles an invoice against a list of payments.
 * Prevents over-crediting, currency mismatch, and determines correct payment status.
 */
export function reconcileInvoiceWithPayments(
  invoice: Invoice,
  payments: Payment[]
): {
  reconciledInvoice: Invoice;
  totalPaidMinor: bigint;
  balanceDueMinor: bigint;
} {
  // Check currencies and uniqueness of idempotency keys
  const seenIdempotencyKeys = new Set<string>();
  let totalPaidMinor = 0n;

  for (const payment of payments) {
    if (payment.currency !== invoice.currency) {
      throw new Error(
        `تعارض في العملات: الدفعة ${payment.id} بعملة ${payment.currency} بينما الفاتورة بعملة ${invoice.currency}`
      );
    }

    if (seenIdempotencyKeys.has(payment.idempotencyKey)) {
      throw new Error(
        `تكرار في مفتاح منع التكرار (Idempotency Key): ${payment.idempotencyKey}`
      );
    }
    seenIdempotencyKeys.add(payment.idempotencyKey);

    totalPaidMinor += payment.amountMinor;
  }

  const balanceDueMinor =
    invoice.totalMinor > totalPaidMinor ? invoice.totalMinor - totalPaidMinor : 0n;

  let status: Invoice["status"] = invoice.status;
  if (invoice.status !== "void") {
    if (totalPaidMinor === 0n) {
      status = invoice.status === "draft" ? "draft" : "issued";
    } else if (totalPaidMinor < invoice.totalMinor) {
      status = "partially_paid";
    } else {
      status = "paid";
    }
  }

  const reconciledInvoice: Invoice = {
    ...invoice,
    paidAmountMinor: totalPaidMinor,
    balanceDueMinor,
    status,
  };

  return {
    reconciledInvoice,
    totalPaidMinor,
    balanceDueMinor,
  };
}
