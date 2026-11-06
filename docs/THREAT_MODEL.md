# THREAT_MODEL — نموذج التهديدات
الإصدار 0.1.0 | Gate 1 Draft | ليس تدقيقاً أمنياً أو شهادة.

## النطاق
واجهة Next.js، جلسات Supabase Auth، PostgreSQL/RLS، التخزين المحلي وOffline queue للحسابات المصادق عليها، الروابط العامة، PDF والملفات، وCI/CD عند تفعيله.

## الأصول
بيانات العملاء والبريف؛ عروض الأسعار والتكاليف والهامش؛ الفواتير والدفعات والدخل؛ الملفات والشعارات؛ public tokens؛ جلسات ومفاتيح Auth؛ مفاتيح Supabase/Vercel؛ النسخ الاحتياطية؛ الكود وسلسلة التوريد.

## الجهات المهددة
زائر غير مصادق؛ مستخدم مصادق يحاول تجاوز ملكية مستخدم آخر؛ عميل يمتلك رابطاً عاماً؛ مهاجم خارجي؛ جهاز مشترك/مفقود؛ dependency أو Action مخترق؛ Agent/مطور يسرّب الأسرار؛ أخطاء تزامن أو صلاحيات، وعزل بيانات Offline بين الحسابات.

## حدود الثقة
Browser↔Next server؛ local↔cloud؛ Next↔Supabase؛ authenticated user↔public link؛ User A↔User B؛ GitHub Actions↔deployment؛ uploaded file↔processor.

## سجل المخاطر
|ID|السيناريو|الأثر|التخفيف/دليل الاختبار|
|---|---|---|---|
|T01|IDOR بتبديل IDs|كشف/تعديل بيانات|ownership checks + اختبار A/B|
|T02|RLS ناقصة|تسريب|RLS لكل جدول + CRUD cross-user|
|T03|Service Role في المتصفح|تجاوز RLS|server-only + bundle scan|
|T04|تخمين/تسريب public token|وصول غير مصرح|token قوي/hash/expiry/revoke/rate limit|
|T05|نسخة عميل تكشف الهامش|كشف أسرار|allowlisted DTO + snapshot tests|
|T06|XSS في نصوص العميل|تنفيذ سكربت|escaping/sanitization + XSS tests|
|T07|CSRF|تغيير غير مقصود|cookie/origin protections + tests|
|T08|Brute force|اختراق/تعطيل|rate limits + threshold tests|
|T10|Offline conflict يكتب فوق دفعة|فساد مالي|versioning + conflict tests|
|T11|تزامن أرقام الفواتير|تكرار|DB sequence/transaction/unique|
|T12|Double-post للدفعة|دخل مضاعف|idempotency + unique constraint|
|T13|ملف ضار/ضخم|استنزاف|type/size/content checks|
|T14|backup crypto خطأ|كشف/فقد|مكتبة موثوقة + restore drill|
|T15|أسرار في Git/logs|اختراق|secret scanning/redaction|
|T16|Action/dependency مخترقة|supply chain|SHA pinning/least privilege|
|T17|PII/token في URL/history|تسريب|opaque token + referrer policy + inspection|
|T18|جهاز مشترك به بيانات محلية|كشف محلي|تحذير ومسح بيانات واضح|
|T19|حذف مالي خاطئ|فقد سجل|ledger/audit/backup/recovery|
|T20|DST/timezone خطأ|موعد خاطئ|IANA timezone + fixtures|

## أولويات
حرجة قبل الإطلاق: T01–T05 وT10–T12 وT14–T15. عالية قبل فتح الروابط أو رفع الملفات: T06–T08 وT13 وT17. مهمة قبل الإصدار: T16 وT18–T20. التصنيف أولي ويعاد تقييم likelihood/impact بعد تثبيت endpoints.

## ضوابط عامة
Deny-by-default؛ least privilege؛ RLS؛ validation؛ عدم الثقة في owner_id؛ server-only secrets؛ لا PII/tokens في URL/logs؛ rate limiting؛ فصل DTO العميل؛ معاملات مالية ذرية؛ backup مشفر مع restore test؛ CI scans وActions SHA pinning.

## الاستجابة للحوادث
احتواء/إبطال token أو session أو تدوير secret؛ تحديد النطاق؛ حفظ أدلة بالحد الأدنى؛ إصلاح السبب واختبار regression؛ إخطار المالك وتقييم واجبات الإخطار القانونية؛ توثيق الحادث.
