"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { calculateRealizedIncome } from "@/lib/income/ledger";
import {
  calculateAssetDepreciation,
  calculateBuyVsRent,
  calculateStudioProfitability,
} from "@/lib/business/calculator";
import { formatMoney } from "@/lib/format/intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Scale } from "lucide-react";

export function BusinessDashboardScreen() {
  const {
    ledgerEntries,
    currency,
    operatingExpensesMinor,
    cameraPurchasePriceMinor,
    cameraUsefulHours,
    cameraUsedHours,
    lensDailyRentalRateMinor,
  } = useProjectStore();

  const [rentalDaysInput, setRentalDaysInput] = useState(30);

  // 1. Realized Income on Cash Basis
  const totalRealizedIncomeMinor = calculateRealizedIncome(ledgerEntries, currency);

  // 2. Equipment Depreciation
  const depreciation = calculateAssetDepreciation({
    id: "cam-main",
    name: "Sony FX3 Cinema Camera",
    purchaseCostMinor: cameraPurchasePriceMinor,
    currency,
    purchasedAt: "2026-01-01",
    expectedUsefulHours: cameraUsefulHours,
    usedHours: cameraUsedHours,
  });

  // 3. Studio Profitability
  const profitability = calculateStudioProfitability({
    currency,
    realizedIncomeMinor: totalRealizedIncomeMinor,
    operatingExpensesMinor,
    equipmentDepreciationMinor: depreciation.accumulatedDepreciationMinor,
  });

  // 4. Buy vs Rent Break-even
  const buyVsRent = calculateBuyVsRent({
    purchasePriceMinor: BigInt(5000000), // 50,000 EGP lens purchase
    dailyRentalCostMinor: lensDailyRentalRateMinor, // 2,000 EGP/day
    currency,
    expectedDaysUsedPerYear: rentalDaysInput,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">طبقة الأعمال</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">
              لوحة مؤشرات الأعمال (Business Dashboard)
            </h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            متابعة السيولة النقدية الفعلية، إهلاك المعدات، ونقطة تعادل شراء أو تأجير المعدات.
          </p>
        </div>

        <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
          الأساس المحاسبي: النقدي الفعلي (Cash Basis)
        </Badge>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-soft-ivory">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">الدخل المحصل الفعلي (Cash In)</CardDescription>
            <CardTitle className="text-xl font-bold font-alexandria text-deep-olive">
              {formatMoney(profitability.realizedIncomeMinor, currency, "ar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xs text-text-secondary">لا يحتسب الفواتير غير المحصلة</span>
          </CardContent>
        </Card>

        <Card className="bg-soft-ivory">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">إجمالي المصروفات والإهلاك</CardDescription>
            <CardTitle className="text-xl font-bold font-alexandria text-warm-charcoal">
              {formatMoney(profitability.totalExpensesMinor, currency, "ar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xs text-text-secondary">مصاريف مباشرة + إهلاك معدات</span>
          </CardContent>
        </Card>

        <Card className="bg-soft-ivory">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">صافي أرباح النشاط</CardDescription>
            <CardTitle
              className={`text-xl font-bold font-alexandria ${
                profitability.isProfitable ? "text-status-success" : "text-status-error"
              }`}
            >
              {formatMoney(profitability.netProfitMinor, currency, "ar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xs text-text-secondary">صافي الدخل بعد كافة الأعباء</span>
          </CardContent>
        </Card>

        <Card className="bg-soft-ivory">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">هامش الربح الصافي</CardDescription>
            <CardTitle className="text-xl font-bold font-alexandria text-muted-bronze">
              {profitability.netProfitMarginPercentage.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xs text-text-secondary">نسبة الربح من إجمالي المبيعات</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Depreciation Tracker */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-deep-olive">
              <Wrench className="w-5 h-5" />
              <CardTitle className="text-lg">إهلاك معدات التصوير (Equipment Depreciation)</CardTitle>
            </div>
            <CardDescription>
              حساب إهلاك الكاميرات والعدسات بالساعة الفعلية (مرجع 60,000 ج / 1,000 س = 60 ج/س)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-warm-ivory rounded-lg border border-border-subtle space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-warm-charcoal">Sony FX3 Cinema Camera</span>
                <span className="font-mono text-deep-olive font-bold">
                  {formatMoney(depreciation.depreciationPerHourMinor, currency, "ar")} / ساعة تشغيل
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>ساعات التشغيل المستهلكة:</span>
                <span className="font-mono">{cameraUsedHours} من {cameraUsefulHours} ساعة</span>
              </div>
              <div className="w-full bg-sand-beige/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-deep-olive h-full"
                  style={{ width: `${(cameraUsedHours / cameraUsefulHours) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-2xs">
              <div className="p-2.5 bg-warm-ivory rounded border border-border-subtle">
                <span className="text-text-secondary block">مجمع الإهلاك المستقطع:</span>
                <span className="font-mono font-bold text-warm-charcoal text-xs">
                  {formatMoney(depreciation.accumulatedDepreciationMinor, currency, "ar")}
                </span>
              </div>
              <div className="p-2.5 bg-warm-ivory rounded border border-border-subtle">
                <span className="text-text-secondary block">القيمة الدفترية المتبقية:</span>
                <span className="font-mono font-bold text-deep-olive text-xs">
                  {formatMoney(depreciation.remainingBookValueMinor, currency, "ar")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buy vs Rent Calculator */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-bronze">
              <Scale className="w-5 h-5" />
              <CardTitle className="text-lg">قرار الشراء مقابل التأجير (Buy vs Rent)</CardTitle>
            </div>
            <CardDescription>
              حساب نقطة التعادل الاستثمارية (مرجع 50,000 ج شراء / 2,000 ج إيجار = 25 يوماً)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>الأيام المتوقعة للاستخدام سنوياً:</span>
                <span className="font-bold font-mono text-deep-olive">{rentalDaysInput} يوماً</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={rentalDaysInput}
                onChange={(e) => setRentalDaysInput(parseInt(e.target.value, 10))}
                className="w-full accent-deep-olive cursor-pointer"
              />
            </div>

            <div className="p-3 bg-warm-ivory rounded-lg border border-border-subtle space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">نقطة التعادل المحسوبة:</span>
                <span className="font-bold font-mono text-sm text-warm-charcoal">
                  {buyVsRent.breakEvenDays} يوماً
                </span>
              </div>
              <p className="text-2xs leading-relaxed text-warm-charcoal pt-1 border-t border-border-subtle/50">
                {buyVsRent.reasonAr}
              </p>
            </div>

            <div className="flex items-center justify-between text-2xs text-text-secondary">
              <span>تكلفة التأجير السنوية: {formatMoney(buyVsRent.annualRentalCostMinor, currency, "ar")}</span>
              <Badge variant={buyVsRent.recommendation === "buy" ? "success" : "secondary"}>
                {buyVsRent.recommendation === "buy" ? "القرار: شراء" : "القرار: تأجير"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
