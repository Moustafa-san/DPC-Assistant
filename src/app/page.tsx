"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format/intl";
import {
  FileText,
  Calculator,
  Film,
  HardDrive,
  Palette,
  CalendarDays,
  Receipt,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Sun,
  Coins,
  CheckCircle,
} from "lucide-react";

// Tool & Business Screens
import { BriefScreen } from "@/components/screens/BriefScreen";
import { ProCostScreen } from "@/components/screens/ProCostScreen";
import { ShotlistScreen } from "@/components/screens/ShotlistScreen";
import { StorageScreen } from "@/components/screens/StorageScreen";
import { PaletteScreen } from "@/components/screens/PaletteScreen";
import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { InvoiceScreen } from "@/components/screens/InvoiceScreen";
import { CrmScreen } from "@/components/screens/CrmScreen";
import { TasksScreen } from "@/components/screens/TasksScreen";
import { BusinessDashboardScreen } from "@/components/screens/BusinessDashboardScreen";
import { SopScreen } from "@/components/screens/SopScreen";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCurrency, setSelectedCurrency] = useState<"EGP" | "USD" | "SAR" | "AED">("EGP");

  const sampleAmountMinor = BigInt(6000000); // 60,000 EGP in minor units (Piastres)

  const tools = [
    {
      id: "brief",
      name: "Brief Builder",
      nameAr: "منشئ البريف",
      descAr: "جمع متطلبات وتفضيلات العميل برابط مشاركة آمن ومحدد الصلاحية.",
      icon: FileText,
      badge: "أداة 1",
    },
    {
      id: "cost",
      name: "ProCost",
      nameAr: "التسعير الذكي",
      descAr: "حساب التكاليف بدقة وتوليد نسختي عرض سعر: داخلية وللعميل دون كشف الهامش.",
      icon: Calculator,
      badge: "أداة 2",
    },
    {
      id: "shotlist",
      name: "Pro Shotlist",
      nameAr: "قائمة اللقطات",
      descAr: "قوالب تصوير احترافية، جرد المعدات، والعمل دون اتصال في موقع التصوير.",
      icon: Film,
      badge: "أداة 3",
    },
    {
      id: "storage",
      name: "Storage Calculator",
      nameAr: "حاسبة التخزين",
      descAr: "حساب مساحات الفيديو الخام والصور، الاحتياطي، وحساب عدد كروت الذاكرة.",
      icon: HardDrive,
      badge: "أداة 4",
    },
    {
      id: "palette",
      name: "Cine Palette",
      nameAr: "لوحة الألوان السينمائية",
      descAr: "استخراج الألوان، نسب التوزيع 60/30/10، وتصدير بطاقات الألوان وملفات LUT (.cube).",
      icon: Palette,
      badge: "أداة 5",
    },
    {
      id: "calendar",
      name: "Calendar & Order Sheet",
      nameAr: "التقويم وورقة الأوردر",
      descAr: "تنظيم مواعيد التصوير، ورقة الأوردر، وحساب مواقيت شروق وغروب الشمس بخوارزميات NOAA.",
      icon: CalendarDays,
      badge: "أداة 6",
    },
    {
      id: "invoice",
      name: "Pro Invoice",
      nameAr: "الفواتير والتحصيل",
      descAr: "فواتير ثنائية اللغة، ترقيم ذري، دفعات جزئية مستقلة، وترحيل فوري لدفتر الدخل.",
      icon: Receipt,
      badge: "أداة 7",
    },
  ];

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "brief" && <BriefScreen />}
      {activeTab === "cost" && <ProCostScreen />}
      {activeTab === "shotlist" && <ShotlistScreen />}
      {activeTab === "storage" && <StorageScreen />}
      {activeTab === "palette" && <PaletteScreen />}
      {activeTab === "calendar" && <CalendarScreen />}
      {activeTab === "invoice" && <InvoiceScreen />}
      {activeTab === "crm" && <CrmScreen />}
      {activeTab === "tasks" && <TasksScreen />}
      {activeTab === "business" && <BusinessDashboardScreen />}
      {activeTab === "sop" && <SopScreen />}

      {activeTab === "home" && (
        <div className="space-y-10">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-soft-ivory via-warm-ivory to-sand-beige/60 border border-border-subtle p-6 sm:p-10 shadow-sm">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-olive/10 border border-deep-olive/20 text-deep-olive text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gate 5 Features — نظام التشغيل المتكامل</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-warm-charcoal font-alexandria leading-tight">
                نظام تشغيل متكامل للمصور المستقل وصانع الفيديو
              </h2>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
                من البريف للفلوس — مسار عمل متصل يربط استقبال رغبات العميل، والتسعير، وقائمة اللقطات، ورقة الأوردر، والفواتير، ومتابعة الأرباح في واجهة واحدة موحدة.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button size="lg" onClick={() => setActiveTab("brief")} className="gap-2 font-medium">
                  <span>فتح مشروع العينة المكتمل</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => setActiveTab("cost")} className="gap-2">
                  <span>استعراض التسعير (ProCost)</span>
                </Button>
              </div>
            </div>
          </section>

          {/* Operational Backbone Pipeline */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-warm-charcoal font-alexandria">
                  مسار العمل المتصل (The Operational Backbone)
                </h3>
                <p className="text-sm text-text-secondary">
                  اضغط على أي محطة للانتقال الفوري إلى أداتها التنفيذية:
                </p>
              </div>
              <Badge variant="bronze" className="hidden sm:inline-flex">
                دورة عمل متصلة بنسبة 100%
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
              {[
                { id: "brief", label: "1. البريف" },
                { id: "cost", label: "2. التسعير" },
                { id: "shotlist", label: "3. اللقطات" },
                { id: "calendar", label: "4. التقويم" },
                { id: "calendar", label: "5. التنفيذ" },
                { id: "invoice", label: "6. الفاتورة" },
                { id: "invoice", label: "7. الدفعات" },
                { id: "crm", label: "8. العملاء" },
                { id: "business", label: "9. المؤشرات" },
              ].map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(step.id)}
                  className="bg-soft-ivory border border-border-subtle rounded-lg p-2.5 text-center text-xs font-semibold text-warm-charcoal shadow-2xs hover:border-deep-olive hover:bg-sand-beige/40 transition-colors cursor-pointer"
                >
                  {step.label}
                </button>
              ))}
            </div>
          </section>

          {/* Core Tools Grid */}
          <section className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-warm-charcoal font-alexandria">
                الأدوات السبع الأساسية (The 7 Core Tools)
              </h3>
              <p className="text-sm text-text-secondary">
                كافة الأدوات السبع تعمل بكامل وظائفها وبياناتها التفاعلية المترابطة:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card key={tool.id} className="flex flex-col justify-between hover:border-deep-olive transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-deep-olive/10 text-deep-olive flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary">{tool.badge}</Badge>
                      </div>
                      <CardTitle className="text-lg">{tool.nameAr}</CardTitle>
                      <p className="text-xs font-mono text-muted-bronze">{tool.name}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <CardDescription>{tool.descAr}</CardDescription>
                    </CardContent>
                    <CardFooter className="pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab(tool.id)}
                        className="w-full justify-between text-xs font-semibold"
                      >
                        <span>فتح الأداة</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Verification Cards */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-warm-charcoal font-alexandria">
              القواعد الحاكمة لمنع الأخطاء المحاسبية والتكرار
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-deep-olive mb-1">
                    <Coins className="w-5 h-5" />
                    <CardTitle className="text-base">تنسيق العملات الصارم</CardTitle>
                  </div>
                  <CardDescription>
                    تخزين بوحدات العملة الصغرى (Integer Minor Units) دون أخطاء عائمة.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {(["EGP", "USD", "SAR", "AED"] as const).map((curr) => (
                      <Button
                        key={curr}
                        size="sm"
                        variant={selectedCurrency === curr ? "default" : "outline"}
                        onClick={() => setSelectedCurrency(curr)}
                        className="text-xs h-8 px-2.5"
                      >
                        {curr}
                      </Button>
                    ))}
                  </div>
                  <div className="p-3 bg-warm-ivory rounded-lg border border-border-subtle">
                    <div className="text-xs text-text-secondary">المبلغ المخزن برمجياً:</div>
                    <div className="font-mono text-xs text-warm-charcoal">
                      {sampleAmountMinor.toString()} minor units
                    </div>
                    <div className="text-xs text-text-secondary mt-2">التنسيق عبر Intl:</div>
                    <div className="text-lg font-bold text-deep-olive font-alexandria">
                      <span className="numeric-ltr">{formatMoney(sampleAmountMinor, selectedCurrency, "ar")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-muted-bronze mb-1">
                    <Sun className="w-5 h-5" />
                    <CardTitle className="text-base">مرجع شمس القاهرة الفلكي</CardTitle>
                  </div>
                  <CardDescription>
                    خوارزميات NOAA الفلكية الصافية لـ Africa/Cairo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <div className="p-2.5 bg-warm-ivory rounded-lg border border-border-subtle flex justify-between items-center">
                    <span className="text-text-secondary">شروق الشمس (Sunrise):</span>
                    <span className="font-bold text-warm-charcoal font-mono">06:12 صباحاً</span>
                  </div>
                  <div className="p-2.5 bg-warm-ivory rounded-lg border border-border-subtle flex justify-between items-center">
                    <span className="text-text-secondary">غروب الشمس (Sunset):</span>
                    <span className="font-bold text-warm-charcoal font-mono">17:05 مساءً</span>
                  </div>
                  <div className="p-2.5 bg-warm-ivory rounded-lg border border-border-subtle flex justify-between items-center">
                    <span className="text-text-secondary">الساعة الذهبية:</span>
                    <span className="font-mono text-deep-olive font-bold">16:34 — 17:15</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-deep-olive mb-1">
                    <ShieldCheck className="w-5 h-5" />
                    <CardTitle className="text-base">جاهزية الأمان والعمل الميداني</CardTitle>
                  </div>
                  <CardDescription>
                    حماية كاملة، عزل للحسابات، وجاهزية تامة للعمل دون اتصال.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span>RLS على كافة جداول قاعدة البيانات (12 جدولاً).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span>الروابط العامة مشفرة وبمحدد 30 طلباً/دقيقة.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span>طابور العمليات معزول ومحصن من التسريب.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span>توليد ملفات 3D LUT (.cube) القياسية فورياً.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
