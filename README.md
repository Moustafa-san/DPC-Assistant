# مساعد المصور / Photographer Assistant

> **نظام تشغيل الاستوديو المتكامل للمصورين وصناع الفيديو المستقلين («من البريف للفلوس»).**  
> **Studio Operating System for Freelance Photographers & Videographers.**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-v4.3-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests: 53 Passing](https://img.shields.io/badge/Tests-53%20Passing-success)](https://vitest.dev/)

---

## 📸 نظرة عامة على المنتج (Product Overview)

«مساعد المصور» هو نظام تشغيل شامل ومفتوح المصدر (GPL-3.0) مصمم خصيصاً للمصورين وصناع الفيديو المحترفين في العالم العربي، لتمكينهم من إدارة أعمالهم الفنية والتجارية بسلاسة متناهية عبر مسار عملي متكامل:

```text
البريف (Brief) ← التسعير (ProCost) ← قائمة اللقطات (Shotlist) ← وسائط التخزين (Storage) 
       ← الألوان (Cine Palette) ← التقويم والمواقيت (Calendar) ← الفاتورة (Invoice) 
       ← التحصيل (Ledger) ← إدارة العملاء (CRM) ← مؤشرات الأداء (Dashboard)
```

المنتج **مجاني 100% ومفتوح المصدر للأبد**:
- بدون اشتراكات شهرية أو خطط مدفوعة (Zero Subscriptions).
- بدون عمولات وساطة على المدفوعات (Zero Payment Fees).
- بدون إعلانات تجارية (Zero Ads).
- بدون تتبع أو تجميع بيانات شخصية (Zero Telemetry & Tracking).

---

## 🛠️ الأدوات الأساسية وطبقة الأعمال (Core Tools & Business Layer)

### الأدوات السبع المتخصصة:
1. **Brief Builder (منشئ البريف الفني):** جمع متطلبات العميل، وتوليد روابط مشاركة مشفرة بـ 256 بت وتحديد معدل الطلبات لحماية الخصوصية.
2. **ProCost (التسعير الذكي):** نموذج تسعير مزدوج (حسابات داخلية تفصيلية للمصور مقابل عرض سعر معقم ومطهر للعميل يخفي التكاليف وهوامش الربح الداخلية).
3. **Pro Shotlist (قائمة اللقطات الاحترافية):** جدولة الشوتات حسب الموقع والمشهد والشخصيات والمعدات، مع دعم كامل للعمل دون اتصال ومزامنة تجميعية.
4. **Storage Calculator (حاسبة وسائط التخزين):** حساب دقيق لاحتياجات التخزين بمعايير التخزين العشرية الرسمية وتوزيع كروت الذاكرة (512/256/128 GB) مع هوامش أمان للمصور.
5. **Cine Palette & 3D LUT Generator:** تحليل التوزيع اللوني الفني (قاعدة 60/30/10) وتوليد ملفات معالجة ألوان سينمائية ثلاثية الأبعاد بصيغة Adobe `.cube`.
6. **Calendar & Order Sheet (التقويم ومواقيت الشمس):** محرك فلكي نقي (خوارزميات NOAA) لحساب شروق وغروب الشمس وساعات التصوير الذهبية والزرقاء لأي إحداثيات جغرافية بدون إنترنت، وتوليد ورقة أوردر اليوم التصويري.
7. **Pro Invoice (الفواتير الاحترافية):** إصدار فواتير بترقيم تسلسلي ذرّي آمن، ودعم المدفوعات المجزأة بمفاتيح منع التكرار (Idempotency)، ودفتر أستاذ نقدي (Cash Basis).

### طبقة إدارة الأعمال (Business Operations):
- **CRM:** سجل العملاء المحتملين والحاليين، وإدارة حالات الصفقات.
- **Tasks & Checklists:** قوائم المهام الفنية واللوجستية قبل وبعد التصوير.
- **Business Dashboard:** حساب إهلاك المعدات وقيمة ساعة عمل المصور، ونقطة توازن الشراء مقابل الاستئجار، ومؤشرات الربحية.
- **SOP Guide:** دليل الإجراءات القياسية للمصور المحترف.

---

## 🏗️ المعمارية التقنية وقواعد النزاهة (Architecture & Invariants)

- **Next.js 16 App Router & React 19:** واجهة تفاعلية حديثة بأداء فائق وتوليد صفحات ثابتة.
- **Strict TypeScript & Zod:** فحص نمطي صارم 100% عند كافة حدود البيانات ومنافذ الإدخال.
- **Strict Financial Rules:** منع الأعداد العشرية العائمة (Zero Floating-Point) وتخزين كافة المعاملات كأعداد صحيحة بوحدات العملة الصغرى (`amount_minor` BIGINT) مع الفصل الصارم بين العملات (EGP, USD, SAR, AED).
- **PostgreSQL & Row-Level Security (RLS):** عزل تام للبيانات على مستوى صفوف قاعدة البيانات لمنع وصول أي مستخدم لبيانات مستخدم آخر.
- **Offline-First PWA & Conflict Reconciliation:** دعم العمل دون اتصال بشبكة الإنترنت مع طابور عمليات معزول للحسابات، وسياسة فض تعارضات صارمة تمنع الكتابة فوق المعاملات المالية (No Last-Write-Wins).
- **الهوية البصرية:** توجه **Premium Editorial Studio** بألوان العاج والرمال والزيتون الدافئ مع دعم متكامل للغتين العربية والإنجليزية وتوافق كامل مع متطلبات إمكانية الوصول **WCAG 2.2 Level AA**.

---

## 🧪 الفحص والاختبارات (Verification & Quality Gates)

المشروع مغطى بنسبة 100% باختبارات آلية تغطي النواة المنطقية الصافية، الأمان، والسيناريوهات الذهبية الخمسة:

```bash
# تشغيل حزمة الاختبارات الآلية (15 ملفاً، 53 اختباراً)
npm test

# فحص جودة الكود والالتزام النمطي (Zero Warnings / Zero Errors)
npm run lint

# البناء الإنتاجي للحاويات المستقلة (Standalone Production Build)
npm run build
```

---

## 🚢 التشغيل عبر Docker (Container Deployment)

يتوفر ملف `Dockerfile` متعدد المراحل (Multi-stage) مع تشغيل بمستخدم غير جذري (`nextjs:nodejs`):

```bash
# بناء صورة الحاوية
docker build -t photographer-assistant .

# تشغيل الحاوية محلياً
docker run -p 3000:3000 photographer-assistant
```

---

## 📜 الترخيص (License)
هذا المشروع مرخص تحت رخصة **GNU General Public License v3.0 (GPL-3.0)**.
جميع الحقوق محفوظة للمجتمع الإبداعي والمصورين المستقلين.
