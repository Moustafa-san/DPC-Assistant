# ARCHITECTURE — المعمارية التقنية
الإصدار 0.1.0 | Gate 1 Draft

## 1. قرارات معتمدة من PROJECT_DOCUMENTATION.md v1.1.0
Next.js 16 App Router؛ TypeScript strict؛ Tailwind CSS 4؛ shadcn/ui New York + Lucide؛ Zustand؛ Zod؛ Supabase PostgreSQL/Auth/RLS؛ Vercel؛ PWA؛ GPL-3.0؛ الأدوات محمية بالمصادقة ولا يوجد Guest Mode في MVP.

## 2. مبادئ
- Domain logic مستقل عن React/DOM/Next.
- Repositories/adapters تفصل الواجهة عن التخزين.
- Zod على الإدخال والاستيراد والاستعادة والحدود.
- لا تفتح الأدوات عند غياب Supabase env؛ Landing والمحتوى العام فقط يمكن أن يعملا دون إعداد Supabase.
- Supabase Service Role server-only.
- Migrations محفوظة ومراجعة.
- RLS لكل جدول user-owned واختبارات cross-user.

## 3. التصور
```text
Next.js App Router
  UI + Zustand
  Application use-cases
  Domain (pure functions/entities/policies)
  Zod validation
  Repository ports
    Local adapter (IndexedDB candidate; authenticated-account scoped only)
    Supabase adapter
      PostgreSQL + RLS + Auth
```
لا يستورد Domain مكتبات واجهة أو مزود قاعدة البيانات.

## 4. تنظيم أولي
```text
src/
  app/
  components/{screens,ui}
  lib/
    types/
    schemas/
    store/
    format/
    pricing/
    invoice/
    income/
    palette/
    solar/
    storage-calc/
    business/
    __tests__/
```
الهيكل مبني على v1.1؛ يمكن تحسينه عبر ADR.

## 5. Routing
يوجد تعارض: §5.3 يصف `/` واحداً بسبب قيود المعاينة، و§8.1 يذكر مسارات لغة منفصلة، والروابط العامة تحتاج URL قابل للمشاركة. المقترح `/ar`, `/en`, `/<locale>/p/<token>` مع تنقل داخلي لباقي مساحة التطبيق. لا ينفذ قبل اعتماد ADR-003.

## 6. Local/Offline
لا توجد مساحة عمل أو أدوات مجهولة/Guest في MVP. أي بيانات محلية أو Offline تخص حساباً تمت مصادقته، ويجب عزل IndexedDB والـ queue حسب user ID، ومسح/قفل البيانات الحساسة أو منع الوصول إليها عند logout أو تبديل الحساب وفق سياسة معتمدة.
Zustand لحالة الواجهة؛ IndexedDB خلف adapter مرشح للبيانات الكبيرة والـ queue. يلزم schema versioning، migrations، quota handling، export/restore، operation IDs، conflict policy حسب نوع الكيان. لا last-write-wins للمال والفواتير.

## 7. Supabase
Auth، Postgres، RLS، migrations. لا تثق في owner_id من العميل. تحقق من ownership في الخادم. Public access عبر endpoint محدود وليس SELECT عام على الجداول. لا Service Role في browser bundle.

## 8. المال
integer minor units، currency code، exchange snapshot، invoice sequence ذري، payments مستقلة، idempotency، income ledger مصدر حقيقة للتحصيل.

## 9. الروابط العامة
سجل خادمي، token قوي عشوائي، تخزين hash، expiry/revoke، rate limit، allowlisted fields/actions، عدم تسجيل token أو تضمين بيانات البريف في URL.

## 10. PDF والنشر
PDF Arabic spike في Gate 2. المسار المستهدف GitHub→Vercel وSupabase، لكن لا repo/remote/push/deploy دون إذن. الأسرار عبر secret manager/env ولا تُلصق بالمحادثة.
