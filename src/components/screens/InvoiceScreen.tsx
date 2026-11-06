"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { formatMoney, formatDate } from "@/lib/format/intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, PlusCircle, Printer } from "lucide-react";

export function InvoiceScreen() {
  const { invoice, payments, recordPayment, client, currency } = useProjectStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountEgp, setPaymentAmountEgp] = useState("25014");
  const [paymentMethod, setPaymentMethod] = useState<"instapay" | "bank_transfer" | "cash">("instapay");

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmountEgp) || 0;
    if (amountNum > 0) {
      const amountMinor = BigInt(Math.round(amountNum * 100)); // EGP to Piastres
      recordPayment(amountMinor, paymentMethod);
      setShowPaymentModal(false);
    }
  };

  const isFullyPaid = invoice.status === "paid";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle no-print">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">أداة 7</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">الفواتير والتحصيل (Pro Invoice)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            فواتير مهنية ثنائية اللغة، ترقيم ذري، ودفعات جزئية مستقلة ترحل لدفتر الدخل.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isFullyPaid && (
            <Button onClick={() => setShowPaymentModal(true)} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل دفعة محصلة</span>
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" />
            <span>طباعة أو حفظ PDF</span>
          </Button>
        </div>
      </div>

      {/* Payment Entry Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-warm-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl bg-soft-ivory">
            <CardHeader>
              <CardTitle className="text-lg">تسجيل دفعة نقدية جديدة</CardTitle>
              <CardDescription>
                يُسجل الدخل الفعلي في دفتر الأستاذ فوراً بمفتاح عملية فريد يمنع التكرار
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddPayment}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    المبلغ المحصل بالجنيه (EGP):
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={paymentAmountEgp}
                    onChange={(e) => setPaymentAmountEgp(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border-subtle bg-warm-ivory text-sm font-mono font-bold"
                    required
                  />
                  <span className="text-2xs text-text-secondary">
                    المبلغ المتبقي: {formatMoney(invoice.balanceDueMinor, currency, "ar")}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">
                    طريقة الدفع والتحصيل:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as unknown as "instapay" | "bank_transfer" | "cash")}
                    className="w-full p-2.5 rounded-lg border border-border-subtle bg-warm-ivory text-sm"
                  >
                    <option value="instapay">تحويل إنستاباي (InstaPay)</option>
                    <option value="bank_transfer">تحويل بنكي مباشر</option>
                    <option value="cash">نقداً (Cash)</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-warm-ivory/50">
                <Button type="button" variant="ghost" onClick={() => setShowPaymentModal(false)}>
                  إلغاء
                </Button>
                <Button type="submit">تأكيد وقيد الدفعة</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Main Printable Invoice Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-soft-ivory border-border-subtle shadow-sm p-6 sm:p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-border-subtle pb-6">
              <div>
                <span className="text-xs font-bold tracking-widest text-muted-bronze uppercase block mb-1">
                  فاتورة ضريبية رسمية • TAX INVOICE
                </span>
                <h3 className="text-2xl font-bold font-alexandria text-warm-charcoal">استوديو مساعد المصور</h3>
                <p className="text-xs text-text-secondary mt-1">القاهرة، جمهورية مصر العربية</p>
              </div>

              <div className="text-end space-y-1">
                <div className="text-sm font-bold font-mono text-deep-olive">
                  {invoice.invoiceNumber}
                </div>
                <Badge
                  variant={isFullyPaid ? "success" : "warning"}
                  className="font-semibold text-xs"
                >
                  {isFullyPaid ? "مدفوعة بالكامل (PAID)" : "دفعة جزئية (PARTIAL)"}
                </Badge>
                <div className="text-xs text-text-secondary pt-1">
                  تاريخ الإصدار: {invoice.issueDate}
                </div>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-text-secondary block mb-1 font-semibold">فاتورة إلى (Bill To):</span>
                <p className="font-bold text-sm text-warm-charcoal">{client.name}</p>
                <p className="text-text-secondary">{client.company}</p>
                <p className="text-text-secondary font-mono">{client.phone}</p>
              </div>
              <div className="text-end">
                <span className="text-text-secondary block mb-1 font-semibold">تاريخ الاستحقاق:</span>
                <p className="font-mono font-medium">{invoice.dueDate}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-border-subtle text-text-secondary font-semibold">
                    <th className="py-2.5 text-start">الوصف (Description)</th>
                    <th className="py-2.5 text-center">الكمية</th>
                    <th className="py-2.5 text-end">سعر الوحدة</th>
                    <th className="py-2.5 text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="text-warm-charcoal">
                      <td className="py-3 font-medium">{item.description}</td>
                      <td className="py-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 text-end font-mono">
                        {formatMoney(item.unitPriceMinor, invoice.currency, "ar")}
                      </td>
                      <td className="py-3 text-end font-mono font-semibold">
                        {formatMoney(item.totalPriceMinor, invoice.currency, "ar")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="border-t border-border-subtle pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>المجموع الفرعي (Subtotal):</span>
                <span className="font-mono">{formatMoney(invoice.subtotalMinor, invoice.currency, "ar")}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>ضريبة القيمة المضافة ({invoice.taxPercentage}% VAT):</span>
                <span className="font-mono">{formatMoney(invoice.taxAmountMinor, invoice.currency, "ar")}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-border-subtle text-warm-charcoal">
                <span>إجمالي الفاتورة (Total):</span>
                <span className="font-alexandria text-base">
                  {formatMoney(invoice.totalMinor, invoice.currency, "ar")}
                </span>
              </div>
              <div className="flex justify-between text-status-success font-semibold pt-1">
                <span>المسدد فعلياً (Paid to Date):</span>
                <span className="font-mono">-{formatMoney(invoice.paidAmountMinor, invoice.currency, "ar")}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold text-deep-olive pt-2 border-t border-border-subtle">
                <span>المبلغ المتبقي للاستحقاق (Balance Due):</span>
                <span className="font-mono font-alexandria text-lg">
                  {formatMoney(invoice.balanceDueMinor, invoice.currency, "ar")}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment History & Ledger Status */}
        <div className="space-y-6 no-print">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-deep-olive">
                <Receipt className="w-5 h-5" />
                <CardTitle className="text-base">سجل الدفعات المحصلة</CardTitle>
              </div>
              <CardDescription>الدخل يُسجل فقط عند الاستلام الفعلي للدفعة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="p-3 bg-warm-ivory rounded-lg border border-border-subtle space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-warm-charcoal">{p.method.toUpperCase()}</span>
                    <span className="font-mono text-status-success font-bold">
                      {formatMoney(p.amountMinor, p.currency, "ar")}
                    </span>
                  </div>
                  <div className="flex justify-between text-2xs text-text-secondary">
                    <span>{formatDate(p.paidAt, "ar")}</span>
                    <span className="font-mono truncate max-w-[120px]">{p.idempotencyKey}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
