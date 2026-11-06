import { describe, it, expect } from "vitest";
import { computeInvoiceTotals, reconcileInvoiceWithPayments } from "../invoice/calculator";
import { createLedgerEntry, calculateRealizedIncome } from "../income/ledger";
import { Invoice, Payment } from "../schemas/invoice";

describe("Invoice Calculations, Partial Payments & Ledger Invariants", () => {
  it("computes invoice items, taxes, and subtotal accurately", () => {
    const totals = computeInvoiceTotals({
      items: [
        {
          description: "تصوير حفل زفاف (Full Day)",
          quantity: 1,
          unitPriceMinor: BigInt(2500000), // 25,000 EGP
        },
        {
          description: "ألبوم صور جلد فاخر",
          quantity: 2,
          unitPriceMinor: BigInt(250000), // 2,500 EGP * 2 = 5,000 EGP
        },
      ],
      discountMinor: BigInt(200000), // 2,000 EGP discount
      taxPercentage: 14, // 14% VAT
    });

    // Subtotal: 25,000 + 5,000 = 30,000 EGP (3,000,000 Piastres)
    expect(totals.subtotalMinor).toBe(BigInt(3000000));
    // After 2,000 EGP discount: taxable = 28,000 EGP (2,800,000 Piastres)
    // 14% tax on 28,000 EGP = 3,920 EGP (392,000 Piastres)
    expect(totals.taxAmountMinor).toBe(BigInt(392000));
    // Total = 28,000 + 3,920 = 31,920 EGP (3,192,000 Piastres)
    expect(totals.totalMinor).toBe(BigInt(3192000));
  });

  it("handles milestone payments and updates invoice status without double-counting", () => {
    const baseInvoice: Invoice = {
      id: "inv-001",
      invoiceNumber: "INV-2026-001",
      ownerId: "photographer-1",
      projectId: "proj-wedding-1",
      clientId: "client-1",
      currency: "EGP",
      issueDate: "2026-11-01",
      dueDate: "2026-11-15",
      items: [
        {
          id: "item-1",
          description: "تغطية كاملة",
          quantity: 1,
          unitPriceMinor: BigInt(2000000),
          totalPriceMinor: BigInt(2000000),
        },
      ],
      subtotalMinor: BigInt(2000000),
      discountMinor: 0n,
      taxPercentage: 0,
      taxAmountMinor: 0n,
      totalMinor: BigInt(2000000), // 20,000 EGP
      paidAmountMinor: 0n,
      balanceDueMinor: BigInt(2000000),
      status: "issued",
    };

    // Milestone 1: Deposit of 5,000 EGP (500,000 Piastres)
    const payment1: Payment = {
      id: "pay-1",
      invoiceId: "inv-001",
      amountMinor: BigInt(500000),
      currency: "EGP",
      paidAt: "2026-11-02T10:00:00Z",
      method: "bank_transfer",
      idempotencyKey: "idem-key-deposit-001",
    };

    const step1 = reconcileInvoiceWithPayments(baseInvoice, [payment1]);
    expect(step1.reconciledInvoice.status).toBe("partially_paid");
    expect(step1.reconciledInvoice.paidAmountMinor).toBe(BigInt(500000));
    expect(step1.reconciledInvoice.balanceDueMinor).toBe(BigInt(1500000));

    // Ledger only recognizes 5,000 EGP, NOT the entire 20,000 EGP!
    const ledgerEntry1 = createLedgerEntry(payment1, baseInvoice);
    const realizedIncomeStep1 = calculateRealizedIncome([ledgerEntry1], "EGP");
    expect(realizedIncomeStep1).toBe(BigInt(500000));

    // Milestone 2: Final Payment of remaining 15,000 EGP (1,500,000 Piastres)
    const payment2: Payment = {
      id: "pay-2",
      invoiceId: "inv-001",
      amountMinor: BigInt(1500000),
      currency: "EGP",
      paidAt: "2026-11-05T14:00:00Z",
      method: "instapay",
      idempotencyKey: "idem-key-final-002",
    };

    const step2 = reconcileInvoiceWithPayments(baseInvoice, [payment1, payment2]);
    expect(step2.reconciledInvoice.status).toBe("paid");
    expect(step2.reconciledInvoice.paidAmountMinor).toBe(BigInt(2000000));
    expect(step2.reconciledInvoice.balanceDueMinor).toBe(0n);

    const ledgerEntry2 = createLedgerEntry(payment2, baseInvoice);
    const realizedIncomeStep2 = calculateRealizedIncome([ledgerEntry1, ledgerEntry2], "EGP");
    expect(realizedIncomeStep2).toBe(BigInt(2000000));
  });

  it("prevents double-posting via duplicate idempotency keys", () => {
    const invoice: Invoice = {
      id: "inv-002",
      invoiceNumber: "INV-2026-002",
      ownerId: "photographer-1",
      projectId: "proj-1",
      clientId: "client-1",
      currency: "USD",
      issueDate: "2026-11-01",
      dueDate: "2026-11-15",
      items: [
        {
          id: "item-1",
          description: "Corporate Shoot",
          quantity: 1,
          unitPriceMinor: BigInt(100000),
          totalPriceMinor: BigInt(100000),
        },
      ],
      subtotalMinor: BigInt(100000),
      discountMinor: 0n,
      taxPercentage: 0,
      taxAmountMinor: 0n,
      totalMinor: BigInt(100000),
      paidAmountMinor: 0n,
      balanceDueMinor: BigInt(100000),
      status: "issued",
    };

    const payment: Payment = {
      id: "pay-dup",
      invoiceId: "inv-002",
      amountMinor: BigInt(50000),
      currency: "USD",
      paidAt: "2026-11-02T10:00:00Z",
      method: "card",
      idempotencyKey: "same-idempotency-token-1234",
    };

    const duplicatePayment: Payment = {
      ...payment,
      id: "pay-dup-2",
    };

    // Reconciling with repeated idempotency key must throw
    expect(() => reconcileInvoiceWithPayments(invoice, [payment, duplicatePayment])).toThrow(
      /تكرار في مفتاح منع التكرار/
    );
  });
});
