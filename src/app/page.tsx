"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { useProjectStore } from "@/lib/store/project-store";
import { AuthScreen } from "@/components/auth/AuthScreen";
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
  CheckCircle,
  LogIn,
  Camera,
  TrendingUp,
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
  const { user, initialize, isInitialized } = useAuthStore();
  const { loadForUser } = useProjectStore();
  const [activeTab, setActiveTab] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user?.id) {
      loadForUser(user.id);
    }
  }, [user?.id, loadForUser]);

  const tools = [
    {
      id: "brief",
      name: "Brief Builder",
      nameAr: "منشئ البريف",
      descAr: "جمع متطلبات وتفضيلات العميل برابط مشاركة مشفر ومحدد الصلاحية ومحمي بمعدل 30 طلباً/دقيقة.",
      icon: FileText,
      badge: "أداة 1",
    },
    {
      id: "cost",
      name: "ProCost",
      nameAr: "التسعير الذكي",
      descAr: "حساب التكاليف وتوليد نسختي عرض سعر: داخلية للمصور وللعميل مع حجب التكلفة وهوامش الربح الداخلية.",
      icon: Calculator,
      badge: "أداة 2",
    },
    {
      id: "shotlist",
      name: "Pro Shotlist",
      nameAr: "قائمة اللقطات",
      descAr: "قوالب تصوير سينمائية، جرد المعدات، والعمل دون اتصال في موقع التصوير مع دمج تجميعي آمن.",
      icon: Film,
      badge: "أداة 3",
    },
    {
      id: "storage",
      name: "Storage Calculator",
      nameAr: "حاسبة التخزين",
      descAr: "حساب دقيق بالفورميلا العشرية وسعات الفيديو الخام، وهوامش الأمان وتوزيع كروت الذاكرة.",
      icon: HardDrive,
      badge: "أداة 4",
    },
    {
      id: "palette",
      name: "Cine Palette",
      nameAr: "لوحة الألوان السينمائية",
      descAr: "استخراج نسب التوزيع اللوني 60/30/10 وتوليد ملفات معالجة ألوان 3D LUT (.cube) الاحترافية.",
      icon: Palette,
      badge: "أداة 5",
    },
    {
      id: "calendar",
      name: "Calendar & Order Sheet",
      nameAr: "التقويم وورقة الأوردر",
      descAr: "تنظيم مواعيد التصوير، ورقة الأوردر، وحساب مواقيت الشروق والغروب والساعة الذهبية بمعادلات NOAA.",
      icon: CalendarDays,
      badge: "أداة 6",
    },
    {
      id: "invoice",
      name: "Pro Invoice",
      nameAr: "الفواتير والتحصيل",
      descAr: "فواتير احترافية، ترقيم ذري، دفعات مجزأة مستقلة بمفاتيح منع تكرار، وتوليد مباشر لملف PDF عربي.",
      icon: Receipt,
      badge: "أداة 7",
    },
  ];

  // 1. Loading State
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warm-ivory text-warm-charcoal gap-3">
        <div className="w-12 h-12 rounded-xl bg-deep-olive flex items-center justify-center text-warm-ivory animate-pulse shadow-md">
          <Camera className="w-6 h-6" />
        </div>
        <p className="font-alexandria font-medium text-sm text-text-secondary">
          جاري تهيئة مساحة عمل مساعد المصور...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State -> Strict Landing Page (ADR-012)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-warm-ivory text-warm-charcoal">
        {/* Public Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-soft-ivory/95 backdrop-blur-sm px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between mx-auto max-w-7xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-deep-olive flex items-center justify-center text-warm-ivory shadow-xs">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-alexandria font-semibold text-lg leading-tight tracking-tight text-warm-charcoal">
                  مساعد المصور
                </h1>
                <p className="text-xs text-text-secondary hidden sm:block">
                  Photographer Assistant — Studio Operating System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="hidden md:inline-flex">
                GPL-3.0 Open Source
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="gap-2 font-medium min-touch-target"
              >
                <LogIn className="w-4 h-4 text-deep-olive" />
                <span>تسجيل الدخول</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="gap-2 font-medium min-touch-target"
              >
                <span>ابدأ الآن مجاناً</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </header>

        {/* Public Hero & Value Proposition */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-soft-ivory via-warm-ivory to-sand-beige/60 border border-border-subtle p-6 sm:p-12 shadow-sm text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-deep-olive/10 border border-deep-olive/20 text-deep-olive text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>نظام تشغيل الاستوديو المتكامل للمصورين وصناع الفيديو المستقلين</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-warm-charcoal font-alexandria leading-tight">
              «من البريف للفلوس» — كل ما تحتاجه لإدارة إنتاجك الفني والتجاري
            </h2>

            <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              تطبيق عملي مفتوح المصدر يربط استقبال رغبات العميل، التسعير الذكي، قائمة اللقطات، حاسبة التخزين، ورقة الأوردر ومواقيت الشمس، والفواتير والتحصيل المالي في منصة واحدة آمنة.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button size="lg" onClick={() => setShowAuthModal(true)} className="gap-2 font-medium py-3 px-6 text-base shadow-md min-touch-target">
                <span>ابدأ إنشاء مشروعك الأول الآن</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => setShowAuthModal(true)} className="gap-2 py-3 px-6 text-base min-touch-target">
                <LogIn className="w-4 h-4 text-muted-bronze" />
                <span>تسجيل دخول الاستوديو</span>
              </Button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-status-success" /> بدون اشتراكات أو عمولات
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-status-success" /> خصوصية تامة وصفر تتبع
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-status-success" /> جاهز للعمل الميداني دون إنترنت
              </span>
            </div>
          </section>

          {/* The Operational Backbone */}
          <section className="space-y-4 text-center">
            <h3 className="text-2xl font-bold font-alexandria text-warm-charcoal">
              مسار العمل المتصل (The Operational Backbone)
            </h3>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              سلسلة إنتاجية متماسكة تنقل المصور بسلاسة من الخطوة الأولى حتى اكتمال التحصيل المالي:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 pt-4">
              {[
                { label: "1. البريف الفني" },
                { label: "2. التسعير الذكي" },
                { label: "3. قائمة اللقطات" },
                { label: "4. وسائط التخزين" },
                { label: "5. الألوان السينمائية" },
                { label: "6. مواقيت الشمس" },
                { label: "7. الفاتورة والتحصيل" },
                { label: "8. علاقات العملاء" },
                { label: "9. مؤشرات الاستوديو" },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="bg-soft-ivory border border-border-subtle rounded-xl p-3 text-center text-xs font-semibold text-warm-charcoal shadow-xs"
                >
                  {step.label}
                </div>
              ))}
            </div>
          </section>

          {/* The 7 Core Tools Overview */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold font-alexandria text-warm-charcoal">
                الأدوات السبع المتخصصة
              </h3>
              <p className="text-sm text-text-secondary">
                أدوات برمجية دقيقة مصممة بلغة ومعايير صناعة التصوير والسينما:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card key={tool.id} className="bg-soft-ivory border-border-subtle hover:border-deep-olive/40 transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-deep-olive/10 flex items-center justify-center text-deep-olive">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary">{tool.badge}</Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">{tool.nameAr}</CardTitle>
                      <CardDescription className="text-xs text-text-secondary">{tool.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary leading-relaxed">{tool.descAr}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* System Description & User Value Section */}
          <section className="rounded-2xl border border-border-subtle bg-soft-ivory p-6 sm:p-10 space-y-8 shadow-xs">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-olive/10 text-deep-olive text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نظام التشغيل المتكامل للمصورين وصناع الفيديو</span>
              </div>
              <h3 className="font-alexandria font-bold text-2xl sm:text-3xl text-warm-charcoal">
                لماذا تحتاج «مساعد المصور» في عملك اليومي؟
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                صُمم «مساعد المصور» ليكون شريكك التشغيلي الذي ينقل عملك من الفوضى والتقديرات التقريبية إلى إدارة استوديو احترافية شاملة؛ يرافقك خطوة بخطوة من استلام البريف وتوثيق متطلبات العميل، مروراً بحساب أدق تكاليف الإنتاج وتنظيم يوم التصوير، وحتى إصدار الفواتير الرسمية وتنمية أرباحك.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-xl bg-warm-ivory/70 border border-border-subtle/60 flex flex-col justify-between hover:border-deep-olive/30 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-deep-olive/10 flex items-center justify-center text-deep-olive mb-3">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-warm-charcoal mb-2">تسعير دقيق وحماية للأرباح</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    وداعاً للخسائر غير المحسوبة؛ احسب تكاليف الطاقم والمعدات والاستهلاك وهامش ربحك الفعلي بدقة مالية تامة.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-warm-ivory/70 border border-border-subtle/60 flex flex-col justify-between hover:border-deep-olive/30 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-deep-olive/10 flex items-center justify-center text-deep-olive mb-3">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-warm-charcoal mb-2">مظهر احترافي أمام العميل</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    أبهر عملاءك بعروض أسعار وفواتير معتمدة ثنائية اللغة بصيغة PDF أنيقة بالخط العربي، قابلة للطباعة والمشاركة الفورية.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-warm-ivory/70 border border-border-subtle/60 flex flex-col justify-between hover:border-deep-olive/30 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-deep-olive/10 flex items-center justify-center text-deep-olive mb-3">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-warm-charcoal mb-2">تنظيم شامل ليوم التصوير</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    خطة لقطات سينمائية وقوائم تجهيز المعدات مع حاسبة سعة كروت الذاكرة ومواعيد الإضاءة الطبيعية لضمان سلاسة الإنتاج.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-warm-ivory/70 border border-border-subtle/60 flex flex-col justify-between hover:border-deep-olive/30 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-deep-olive/10 flex items-center justify-center text-deep-olive mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-warm-charcoal mb-2">خصوصية تامة وعمل دون إنترنت</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    بياناتك وعملاؤك ملكك وحدك دون اشتراكات أو عمولات، مع قدرة كاملة على العمل دون اتصال أثناء التواجد في اللوكيشن.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Public Footer */}
        <footer className="border-t border-border-subtle bg-soft-ivory py-6 px-4 text-center text-xs text-text-secondary">
          <p>
            مشروع مساعد المصور (Photographer Assistant) — مرخص برخصة البرمجيات الحرة العامة GNU General Public License v3.0 (GPL-3.0).
          </p>
        </footer>

        {/* Auth Modal Screen */}
        {showAuthModal && (
          <AuthScreen
            onSuccess={() => setShowAuthModal(false)}
            onCancel={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  // 3. Authenticated State -> Protected Studio Workspace
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
          {/* Studio Welcome & Quick Start */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-soft-ivory via-warm-ivory to-sand-beige/60 border border-border-subtle p-6 sm:p-10 shadow-sm">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-olive/10 border border-deep-olive/20 text-deep-olive text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مساحة العمل المحمية — استوديو المصور</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-warm-charcoal font-alexandria leading-tight">
                مرحباً بك، {user.fullName || user.email}
              </h2>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
                مسار إنتاجك الفني والتجاري «من البريف للفلوس» جاهز ومترابط. يمكنك استئناف العمل على مشروعك الحالي أو بدء أوردر جديد عبر الأدوات السبع.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button size="lg" onClick={() => setActiveTab("brief")} className="gap-2 font-medium min-touch-target">
                  <span>فتح البريف (Brief Builder)</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => setActiveTab("cost")} className="gap-2 min-touch-target">
                  <span>حاسبة التسعير (ProCost)</span>
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
                  className="bg-soft-ivory border border-border-subtle rounded-lg p-2.5 text-center text-xs font-semibold text-warm-charcoal shadow-2xs hover:border-deep-olive hover:bg-sand-beige/40 transition-colors cursor-pointer min-touch-target"
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
                الأدوات السبع الأساسية
              </h3>
              <p className="text-sm text-text-secondary">
                كافة الأدوات السبع تعمل بكامل وظائفها وبياناتها التفاعلية المترابطة:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card key={tool.id} className="flex flex-col justify-between bg-soft-ivory border-border-subtle">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{tool.badge}</Badge>
                        <div className="w-8 h-8 rounded-lg bg-deep-olive/10 flex items-center justify-center text-deep-olive">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{tool.nameAr}</CardTitle>
                      <CardDescription className="text-xs text-text-secondary">{tool.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary leading-relaxed">{tool.descAr}</p>
                    </CardContent>
                    <CardFooter className="pt-2 border-t border-border-subtle/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab(tool.id)}
                        className="w-full gap-1.5 font-medium min-touch-target"
                      >
                        <span>فتح {tool.nameAr}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Business Layer Highlights */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-warm-charcoal font-alexandria">
                  طبقة إدارة الأعمال (Business Operations)
                </h3>
                <p className="text-sm text-text-secondary">
                  أدوات احترافية لحساب الأرباح، متابعة العملاء، وإدارة المهام الميدانية:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                className="bg-soft-ivory border-border-subtle hover:border-deep-olive cursor-pointer transition-colors"
                onClick={() => setActiveTab("crm")}
              >
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit text-xs">CRM</Badge>
                  <CardTitle className="text-base mt-2">إدارة العملاء والصفقات</CardTitle>
                  <CardDescription>سجل شامل لبيانات العملاء، تواريخ المناسبات، وتاريخ المعاملات.</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="bg-soft-ivory border-border-subtle hover:border-deep-olive cursor-pointer transition-colors"
                onClick={() => setActiveTab("tasks")}
              >
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit text-xs">Checklists</Badge>
                  <CardTitle className="text-base mt-2">المهام وقوائم التحقق</CardTitle>
                  <CardDescription>متابعة مراحل الإنتاج، تجهيز الشنطة والعدسات قبل الأوردر وبعده.</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="bg-soft-ivory border-border-subtle hover:border-deep-olive cursor-pointer transition-colors"
                onClick={() => setActiveTab("business")}
              >
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit text-xs">Analytics</Badge>
                  <CardTitle className="text-base mt-2">مؤشرات الأداء والإهلاك</CardTitle>
                  <CardDescription>إهلاك المعدات، قيمة ساعة العمل، ومقارنة الشراء مقابل الاستئجار.</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="bg-soft-ivory border-border-subtle hover:border-deep-olive cursor-pointer transition-colors"
                onClick={() => setActiveTab("sop")}
              >
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit text-xs">SOP Guide</Badge>
                  <CardTitle className="text-base mt-2">دليل الإجراءات القياسي</CardTitle>
                  <CardDescription>بروتوكولات التصوير المعتمدة ومعايير تسليم المواد والنسخ الاحتياطي.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Security & System Status */}
          <section className="rounded-xl border border-border-subtle bg-soft-ivory p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-deep-olive" />
              <h4 className="font-alexandria font-bold text-lg text-warm-charcoal">
                حالة النظام وجاهزية الأمان
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-status-success shrink-0" />
                <span>RLS مفعل ومحكم على كافة جداول قاعدة البيانات (15 جدولاً علائقياً).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-status-success shrink-0" />
                <span>الروابط العامة مشفرة بـ 256 بت وبمحدد 30 طلباً/دقيقة.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-status-success shrink-0" />
                <span>طابور العمليات دون اتصال مستدام ومحصن بالحسابات.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-status-success shrink-0" />
                <span>توليد وتصدير ملفات PDF عربية و3D LUT (.cube) قياسية.</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
