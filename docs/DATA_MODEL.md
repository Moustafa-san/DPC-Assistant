# DATA_MODEL — نموذج البيانات
الإصدار 0.1.0 | Gate 1 Draft | نموذج منطقي أولي وليس schema نهائياً.

## 1. القواعد العامة
- كل سجل خاص بمستخدم يرتبط بمالك موثوق؛ لا تثق في `owner_id` المرسل من المتصفح.
- RLS على كل جدول user-owned.
- UUID/ULID للمعرفات لا يغني عن فحص الصلاحيات.
- التواريخ UTC مع IANA timezone للأحداث المحلية.
- المال `BIGINT` بوحدات العملة الصغرى مع ISO currency code؛ لا تخزن المال كـ floating point.
- السجلات المتزامنة تحتاج `created_at`, `updated_at`، وعند الحاجة `deleted_at`, `version`, `sync_revision`.
- كل إدخال/استيراد/استعادة يمر عبر Zod.
- أسماء الجداول وحقولها أدناه اقتراح منطقي مستنتج؛ لا تحولها إلى migrations قبل مطابقتها مع §13.2 في `PROJECT_DOCUMENTATION.md`.

## 2. الكيانات المقترحة
|الكيان|الغرض|العلاقات|
|---|---|---|
|profiles|إعدادات الحساب واللغة والعملة|auth.users|
|clients|ملفات العملاء|projects, bookings, invoices|
|projects|المشروع والعملة والحالة والتواريخ|client, brief, quote, shotlist|
|briefs|متطلبات العميل|project, public_links|
|brief_responses|ردود العميل|brief|
|quotes|عروض الأسعار|project, quote_items|
|quote_items|بنود العرض وسعر البيع|quote|
|equipment_catalog|معدات وأسعار إرشادية|scope عام/مالك|
|shotlists|خطة اللقطات|project|
|shots|اللقطات وترتيبها|shotlist|
|gear_items|معدات مطلوبة|shot/shotlist|
|palettes|الألوان والمودات|project|
|calendar_events|مواعيد|project/client|
|bookings|الحجوزات|project/client|
|order_sheets|ورقة الأوردر|booking/project|
|invoices|الفواتير|project/client|
|invoice_items|بنود الفاتورة|invoice|
|payments|الدفعات الجزئية|invoice|
|income_ledger|قيود التحصيل|payment/project|
|expenses|مصروفات النشاط/المشروع|project اختياري|
|tasks|مهام Pre/Day/Post|project|
|time_entries|ساعات العمل|project/task|
|assets|معدات المصور وقيمتها وإهلاكها|owner|
|public_links|روابط محدودة الصلاحية|brief/quote/booking|
|sync_operations|طابور مزامنة|owner/device|
|audit_events|أحداث حساسة عند الحاجة|owner/resource|

المصدر يشير إلى 14 مجموعة/جدول سحابي أولي، لكنه لا يكفي وحده لتثبيت أسماء كل جدول أو حقوله. يجب مراجعة §13.2 قبل اعتماد schema النهائي.

## 3. العلاقات المنطقية
```text
auth.users ─ profiles
profiles ─ clients ─ projects
projects ─ briefs ─ public_links
projects ─ quotes ─ quote_items
projects ─ shotlists ─ shots ─ gear_items
projects ─ palettes
projects ─ calendar_events / bookings ─ order_sheets
projects ─ invoices ─ invoice_items
invoices ─ payments ─ income_ledger
projects ─ tasks / expenses / time_entries
profiles ─ assets / settings / sync_operations
```
الـ cardinality وسياسة cascade/restrict تحتاج اعتماداً بعد ERD.

## 4. RLS والملكية
- الجداول الشخصية: `owner_id = auth.uid()`.
- الجداول التابعة للمشروع تتحقق من ملكية المشروع عبر relationship policy أو owner_id موثوق ومقيد.
- لا تقبل owner_id من العميل كحقيقة.
- لا تمنح anonymous SELECT على الجداول الأصلية للروابط العامة؛ استخدم endpoint وDTO محدودين.
- اختبر CRUD لمستخدم A مقابل بيانات B، وتغيير project_id، والـ joins والملفات.
- أي Storage object يحتاج policy تربطه بالمالك/المشروع.

## 5. قيود وفهارس مقترحة
- indexes على owner_id وproject_id وclient_id وcreated_at/status بحسب الاستعلامات.
- unique على نطاق رقم الفاتورة (مثلاً owner_id + invoice_number) أو sequence آمن.
- idempotency key unique ضمن نطاق العملية المالية.
- check currency ضمن EGP/USD/SAR/AED.
- check amount >= 0 حيث تسمح قواعد المجال.
- لا cascade delete تلقائياً للفواتير والدفعات؛ راجع الأرشفة والالتزامات.
- transaction عند إصدار فاتورة/ترقيمها وعند تسجيل دفعة وترحيل الدخل.

## 6. المال والوقت
حقول مالية نموذجية: `amount_minor BIGINT`, `currency CHAR(3)`. سجل سعر الصرف يتضمن base/quote/rate/source/observed_at. تجنب JS floating point كتمثيل دائم.
المواعيد تحفظ UTC، مع `timezone` مثل `Africa/Cairo` عند الحاجة لحساب/عرض التوقيت المحلي. لا تستخدم UTC+2 ثابتاً.

## 7. التخزين المحلي
Local schema يحتاج schema_version، local IDs، sync state، operation ID، base version، conflict metadata، migrations. لا تخزن secrets في IndexedDB. وضح مخاطر جهاز مشترك للمستخدم.

## 8. Local data for authenticated accounts
لا يوجد Guest Mode أو Guest-to-Account migration ضمن MVP. أي تخزين محلي/Offline يجب أن يرتبط بحساب تمت مصادقته، مع:
1. نطاق تخزين منفصل لكل user ID وعدم إعادة استخدام بيانات الحساب السابق عند تبديل الحساب.
2. schema_version وlocal IDs وsync state وoperation ID وbase version وconflict metadata.
3. عدم تخزين أسرار المصادقة أو مفاتيح Service Role محلياً.
4. تحديد سلوك logout وانتهاء الجلسة وتبديل الحساب قبل الإطلاق؛ لا تعرض البيانات المحلية لحساب آخر.
5. إتاحة مسح البيانات المحلية للحساب عند الطلب، مع توضيح أثر المسح على العمليات غير المتزامنة.

## 9. Offline sync/conflict
كل تعديل يحمل operation ID وbase version. سياسة التعارض تختلف:
- checklist: دمج تغييرات مختلفة قد يكون ممكناً.
- shot ordering: يحتاج ترتيب/نسخة واضحة.
- invoice/payment: لا last-write-wins؛ أوامر مالية ذرية.
- client/project: field-level merge أو طلب اختيار المستخدم.
اعرض pending/failed/conflict بوضوح، ولا تنفذ حذفاً تلقائياً.

## 10. التصدير والحذف والاحتفاظ
تصدير موثق؛ حذف حساب مع بيان ما يحذف وما قد يحتفظ به؛ تحديد أثر الحذف على قيود مالية لازمة؛ inventory لملفات Storage والنسخ الاحتياطية والبيانات المحلية. مدد الاحتفاظ قرار خصوصية مفتوح.
