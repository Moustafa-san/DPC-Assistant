"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { calculatePricing } from "@/lib/pricing/calculator";
import { formatMoney } from "@/lib/format/intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2 } from "lucide-react";

export function ProCostScreen() {
  const { costItems, markupPercentage, discountMinor, taxPercentage, currency, setMarkupPercentage, removeCostItem } =
    useProjectStore();
  const [viewMode, setViewMode] = useState<"internal" | "client">("internal");

  const { internal, client } = calculatePricing({
    items: costItems,
    markupPercentage,
    discountMinor,
    taxPercentage,
    currency,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">أداة 2</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">التسعير الذكي (ProCost)</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            حساب دقيق للتكاليف الأساسية، هامش الربح، وفصل صارم بين النسخة الداخلية ونسخة العميل.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-sand-beige/40 p-1 rounded-lg border border-border-subtle">
          <button
            onClick={() => setViewMode("internal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors min-touch-target cursor-pointer ${
              viewMode === "internal"
                ? "bg-deep-olive text-warm-ivory shadow-xs"
                : "text-warm-charcoal hover:text-deep-olive"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>النسخة الداخلية للمصور</span>
          </button>
          <button
            onClick={() => setViewMode("client")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors min-touch-target cursor-pointer ${
              viewMode === "client"
                ? "bg-deep-olive text-warm-ivory shadow-xs"
                : "text-warm-charcoal hover:text-deep-olive"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>نسخة عرض السعر للعميل</span>
          </button>
        </div>
      </div>

      {viewMode === "internal" ? (
        /* Internal Breakdown View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">بنود التكلفة المباشرة (Direct Costs)</CardTitle>
                  <CardDescription>المعدات، الطاقم، اللوجستيات، والمونتاج</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border-subtle/60">
                  {costItems.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-warm-charcoal">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span className="capitalize">{item.category}</span>
                          <span>•</span>
                          <span>الكمية: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-warm-charcoal">
                          {formatMoney(item.unitCostMinor * BigInt(item.quantity), item.currency, "ar")}
                        </span>
                        <button
                          onClick={() => removeCostItem(item.id)}
                          className="text-text-secondary hover:text-status-error p-1 rounded"
                          title="حذف البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Markup Controller */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">نسبة الهامش الإضافي على التكلفة (Markup %)</CardTitle>
                  <Badge variant="bronze">{markupPercentage}% هامش ربح</Badge>
                </div>
                <CardDescription>
                  الهامش يُحسب كنسبة مضافة فوق التكلفة الأساسية (Markup = Cost × (1 + % / 100))
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                  className="w-full accent-deep-olive cursor-pointer"
                />
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>0% (بدون هامش)</span>
                  <span>25% (اقتصادي)</span>
                  <span>35% (قياسي مستودع)</span>
                  <span>50%+ (ممتاز)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Internal Financial Summary */}
          <div className="space-y-6">
            <Card className="bg-soft-ivory border-deep-olive/20">
              <CardHeader>
                <CardTitle className="text-lg">الملخص المالي الداخلي للمصور</CardTitle>
                <CardDescription>كافة الحسابات بوحدات العملة الصغرى الدقيقة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                  <span className="text-text-secondary">إجمالي التكلفة الأساسية:</span>
                  <span className="font-mono font-semibold">
                    {formatMoney(internal.totalBaseCostMinor, currency, "ar")}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                  <span className="text-text-secondary">مبلغ هامش الربح ({markupPercentage}%):</span>
                  <span className="font-mono font-semibold text-deep-olive">
                    +{formatMoney(internal.markupAmountMinor, currency, "ar")}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border-subtle/60">
                  <span className="text-text-secondary">ضريبة القيمة المضافة ({taxPercentage}%):</span>
                  <span className="font-mono font-semibold text-text-secondary">
                    +{formatMoney(internal.taxAmountMinor, currency, "ar")}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="font-bold text-warm-charcoal">سعر البيع النهائي للعميل:</span>
                  <span className="text-xl font-bold font-alexandria text-deep-olive">
                    {formatMoney(internal.totalClientPriceMinor, currency, "ar")}
                  </span>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-warm-ivory border border-border-subtle text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">صافي هامش الربح من المبيعات:</span>
                    <span className="font-bold text-deep-olive">{internal.netMarginPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Client Quote View (Strictly sanitized, no internal costs visible) */
        <Card className="max-w-2xl mx-auto shadow-md border-border-subtle bg-soft-ivory">
          <CardHeader className="border-b border-border-subtle pb-6">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="mb-2">عرض سعر رسمي للعميل</Badge>
                <CardTitle className="text-2xl font-alexandria">عرض خدمات التصوير والإنتاج</CardTitle>
                <CardDescription>العميل: {useProjectStore.getState().client.name}</CardDescription>
              </div>
              <div className="text-end text-xs text-text-secondary">
                <p>تاريخ العرض: 2026-11-04</p>
                <p>صالح لمدة: 14 يوماً</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-warm-charcoal uppercase tracking-wider">
                تفاصيل الباقات والخدمات
              </h4>
              <div className="divide-y divide-border-subtle">
                {client.items.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-warm-charcoal">{item.name}</p>
                      <p className="text-xs text-text-secondary">باقة مخصصة شاملة التجهيزات والتنفيذ</p>
                    </div>
                    <span className="font-mono font-semibold text-warm-charcoal">
                      {formatMoney(item.totalPriceMinor, client.currency, "ar")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{formatMoney(client.subtotalMinor, client.currency, "ar")}</span>
              </div>
              {client.taxAmountMinor > 0n && (
                <div className="flex justify-between text-text-secondary">
                  <span>ضريبة القيمة المضافة ({client.taxPercentage}%):</span>
                  <span className="font-mono">{formatMoney(client.taxAmountMinor, client.currency, "ar")}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-border-subtle font-bold text-lg text-deep-olive">
                <span>إجمالي العرض النهائي:</span>
                <span className="font-alexandria">{formatMoney(client.totalMinor, client.currency, "ar")}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-warm-ivory/50 border-t border-border-subtle justify-between text-xs text-text-secondary">
            <span>عرض السعر لا يظهر أي تكاليف داخلية أو هوامش مصور.</span>
            <Button size="sm" variant="outline">طباعة أو تصدير PDF</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
