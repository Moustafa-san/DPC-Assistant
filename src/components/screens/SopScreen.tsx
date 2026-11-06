"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle } from "lucide-react";

export function SopScreen() {
  const sops = [
    {
      id: "sop-1",
      title: "إجراءات تصوير حفلات الزفاف (Wedding Production SOP)",
      category: "ميداني",
      steps: [
        "التواجد في الموقع قبل موعد حضور العروسين بـ 45 دقيقة على الأقل.",
        "فحص الكاميرات والتأكد من التسجيل المزدوج على كارتين (Dual Slot Backup).",
        "ضبط حساسية ISO وتوازن البياض (White Balance) يدوياً لكل قاعة وموقع.",
        "استغلال وقت الساعة الذهبية المحدد فلكياً في ورقة الأوردر لجلسة البورتريه الخارجي.",
      ],
    },
    {
      id: "sop-2",
      title: "إجراءات أمان وسائط التخزين والنسخ الاحتياطي (Storage & Redundancy SOP)",
      category: "أمان تقني",
      steps: [
        "حظر فرمتة أو مسح أي كارت ذاكرة في موقع التصوير نهائياً.",
        "نقل الملفات فور انتهاء التصوير على هاردين خارجيين منفصلين (قاعدة 3-2-1).",
        "التحقق من سلامة البايتات (Checksum Verification) قبل إخلاء الكروت.",
        "تخزين النسخة الاحتياطية الأولى في مكان جغرافي منفصل عن الاستوديو.",
      ],
    },
    {
      id: "sop-3",
      title: "إجراءات الفوترة والتحصيل المالي (Invoicing & Financial SOP)",
      category: "مالي",
      steps: [
        "تحصيل عربون الحجز (25% إلى 50%) قبل تثبيت التاريخ في التقويم.",
        "إصدار فاتورة رسمية برقم ذري غير متكرر وتحديد جدول الدفعات بوضوح.",
        "عدم تسليم الملفات النهائية عالية الدقة (High-Res) إلا بعد سداد الرصيد بالكامل.",
        "ترحيل كل دفعة فوراً لدفتر الدخل على الأساس النقدي الفعلي.",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">طبقة الأعمال</Badge>
            <h2 className="text-2xl font-bold font-alexandria text-warm-charcoal">
              إجراءات التشغيل القياسية (SOP Library)
            </h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            دليل الممارسات الاحترافية القياسية للمصور وصانع الفيديو لضمان الجودة ومنع الأخطاء.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sops.map((sop) => (
          <Card key={sop.id} className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <Badge variant="outline" className="text-2xs">{sop.category}</Badge>
                <BookOpen className="w-4 h-4 text-deep-olive" />
              </div>
              <CardTitle className="text-base leading-snug">{sop.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              {sop.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded bg-warm-ivory border border-border-subtle/60">
                  <CheckCircle className="w-3.5 h-3.5 text-deep-olive shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
