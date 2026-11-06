# IMPLEMENTATION_PLAN — خطة التنفيذ
الإصدار 0.1.0 | Gate 1 Draft

## الحالة الابتدائية
لا يوجد كود أو مستودع سابق، ولا package.json أو migrations أو tests أو CI. لا GitHub repo مرتبط بهذه الجلسة. المستخدم ينوي الرفع بعد اكتمال العمل ثم النشر على Vercel وربط Supabase. لا مفاتيح إنتاجية حالياً. لا GitHub repo/remote/push/deploy دون إذن.

## Gates
|Gate|النطاق|المخرجات|القبول|
|---|---|---|---|
|0|Reconnaissance|جرد الوثائق والتعارضات|مكتمل|
|0b|مراجعة كود سابق|فحوص وجرد|متجاوز لعدم وجود كود|
|1|Product/UX/Architecture/Risk|PRD/UX/Architecture/Data/Threat/ADRs/ASVS/Privacy|مراجعة واعتماد|
|2|Foundation|Next/TS/Tailwind/shadcn/i18n/shell/PWA/PDF spike|lint/typecheck/build + ar/en + 3 مقاسات|
|3|Domain Core|types/Zod وحسابات pure وfixtures|اختبارات حدود ومعادلات|
|4|Persistence/Auth/Sync|IndexedDB/Supabase/RLS/queue/tokens|Auth gate + no Guest mode/fallback + RLS/account-isolation tests|
|5|Features|الأدوات السبع وطبقة الأعمال والتكاملات|رحلة end-to-end|
|6|Quality|E2E/offline/a11y/security/performance/backup|سيناريوهات القبول تمر|
|7|Release|CI/Docker/docs/rollback/deployment readiness|CI أخضر وموافقة نشر|

## Gate 1
إكمال PRD؛ اعتماد UX flows؛ حسم أو توثيق ADRs؛ نموذج بيانات؛ Threat Model؛ Privacy screen؛ ASVS matrix؛ dependencies/spikes؛ مراجعة بشرية وموافقة Gate 2.

## Gate 2
تأكيد مسار المستودع؛ اختيار package manager؛ تهيئة Next 16/TS strict؛ Tailwind 4/shadcn؛ typed i18n/RTL؛ shell؛ Zod/domain foundation؛ test runner وCI؛ PWA؛ PDF Arabic spike. لا remote أو نشر دون إذن.

## Gate 3
Money primitives؛ currency conversion snapshots؛ pricing؛ storage؛ solar NOAA + IANA TZ؛ depreciation؛ buy-vs-rent؛ hourly value/profitability؛ palette؛ LUT `.cube`؛ invoice calculations؛ golden/property/boundary tests.

## Gate 4
Local adapter وschema versioning؛ Supabase migrations/Auth/profiles/RLS؛ cross-user tests؛ offline queue/conflicts؛ public tokens/rate limits؛ export/delete.

## Gate 5
Brief، ProCost، Shotlist، Storage، Palette، Calendar/Order Sheet، Invoice/payment ledger، Tasks، CRM، Dashboard، SOP، وكل التكاملات.

## Gate 6
Playwright mobile/desktop × ar/en؛ Landing/auth-gate flows؛ offline/reconnect/conflict؛ PDF inspection؛ RLS/IDOR؛ token lifecycle؛ XSS/CSRF/input; accessibility؛ performance/PWA؛ backup/restore.

## Gate 7
CI lint/typecheck/unit/integration/E2E/build؛ secret/dependency scans؛ SAST مناسب؛ Actions SHA pinning؛ SBOM إذا انطبق؛ Docker Next standalone (لا وصفة nginx static القديمة)؛ Vercel/Supabase docs؛ rollback؛ known limitations. الرفع والنشر بموافقة صريحة.

## المخاطر
PDF عربي؛ RLS؛ Offline conflicts؛ SMTP؛ invoice concurrency؛ DST؛ scope creep؛ dependencies/actions. لكل خطر owner وخطة اختبار قبل الانتقال.

## Definition of Done
المخرجات موجودة؛ الاختبارات المطلوبة شُغلت؛ لا blockers مخفية؛ المخاطر المفتوحة موثقة؛ لا تغييرات خارج النطاق؛ تقرير يذكر ما تم وما لم يتم؛ موافقة المستخدم عند القرارات الجوهرية.
