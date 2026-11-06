import { z } from "zod";
import { supportedCurrencySchema } from "./common";

export const invoiceStatusSchema = z.enum([
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "void",
]);

export const invoiceItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, "وصف البند مطلوب"),
  quantity: z.number().positive(),
  unitPriceMinor: z.bigint().nonnegative(),
  totalPriceMinor: z.bigint().nonnegative(),
});

export const paymentMethodSchema = z.enum([
  "cash",
  "bank_transfer",
  "instapay",
  "check",
  "card",
  "other",
]);

export const paymentSchema = z.object({
  id: z.string().min(1),
  invoiceId: z.string().min(1),
  amountMinor: z.bigint().positive("مبلغ الدفعة يجب أن يكون أكبر من الصفر"),
  currency: supportedCurrencySchema,
  paidAt: z.string().datetime(),
  method: paymentMethodSchema,
  idempotencyKey: z.string().min(16, "مفتاح فريد لمنع تكرار القيد"),
  notes: z.string().optional(),
});

export const invoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNumber: z.string().min(1),
  ownerId: z.string().min(1),
  projectId: z.string().min(1),
  clientId: z.string().min(1),
  currency: supportedCurrencySchema,
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, "يجب أن تحتوي الفاتورة على بند واحد على الأقل"),
  subtotalMinor: z.bigint().nonnegative(),
  discountMinor: z.bigint().nonnegative().default(0n),
  taxPercentage: z.number().min(0).max(100).default(0),
  taxAmountMinor: z.bigint().nonnegative().default(0n),
  totalMinor: z.bigint().nonnegative(),
  paidAmountMinor: z.bigint().nonnegative().default(0n),
  balanceDueMinor: z.bigint().nonnegative(),
  status: invoiceStatusSchema,
});

export const incomeLedgerEntrySchema = z.object({
  id: z.string().min(1),
  paymentId: z.string().min(1),
  invoiceId: z.string().min(1),
  projectId: z.string().min(1),
  amountMinor: z.bigint().positive(),
  currency: supportedCurrencySchema,
  recognizedAt: z.string().datetime(),
  idempotencyKey: z.string().min(1),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type IncomeLedgerEntry = z.infer<typeof incomeLedgerEntrySchema>;
