# ASVS_CONTROL_MATRIX — مصفوفة ضوابط أمن التطبيق
الإصدار 0.1.0 | Gate 1 Draft

**مرجع تخطيطي:** OWASP ASVS 5.0.0، ويجب التحقق من الإصدار والمعرفات الرسمية عند تحويل البنود إلى checklist. **الهدف المقترح:** Level 2، وليس شهادة امتثال. هذه مصفوفة موضوعية أولية وليست نسخاً حرفياً لكل متطلبات ASVS.

|ID|المجال|الضابط|الدليل|Gate|
|---|---|---|---|---|
|SEC01|Architecture|حدود الثقة وتدفقات البيانات موثقة|Architecture/Threat Model|1|
|SEC02|Auth|Supabase Auth وعدم بناء كلمات مرور خاصة|integration tests|4|
|SEC03|Auth|تأكيد البريد قبل أول حفظ سحابي|workflow test|4|
|SEC04|Session|إعداد session/cookies آمن|config review/tests|4|
|SEC05|Access|RLS لكل جدول user-owned|migration audit|4|
|SEC06|Access|اختبارات CRUD بين A وB|RLS automated tests|4/6|
|SEC07|Access|منع IDOR في server handlers|negative tests|4/6|
|SEC08|Input|Zod على حدود الإدخال|schema tests|2–5|
|SEC09|Output|escaping ومنع XSS|XSS tests|5/6|
|SEC10|CSRF|حماية عمليات تغيير الحالة|origin/cookie tests|6|
|SEC11|Public|token قوي ومجزأ ومنتهي وقابل للإبطال|lifecycle tests|4|
|SEC12|Public|DTO لا يكشف بيانات داخلية|snapshot tests|4/5|
|SEC13|Rate|rate limit للروابط العامة والدخول|threshold tests|4|
|SEC14|Secrets|لا أسرار في bundle أو Git|secret scan|2/7|
|SEC15|Logging|redaction للـ PII/tokens|log review|2–7|
|SEC16|Files|نوع/حجم/محتوى الملفات|upload tests|عند الرفع|
|SEC17|Crypto|مكتبات موثوقة وعدم اختراع crypto|design review|4/6|
|SEC18|Backup|تشفير واستعادة النسخ|restore drill|6|
|SEC19|Money|integer minor units|unit/property tests|3|
|SEC20|Payments|idempotency ومنع double posting|replay/concurrency|5|
|SEC21|Invoice|ترقيم ذري وunique constraint|parallel test|5|
|SEC22|Sync|لا last-write-wins للمال|conflict tests|4/6|
|SEC23|Privacy|تقليل/تصدير/حذف|privacy review/tests|4/6|
|SEC24|i18n|RTL/LTR|Playwright ar/en|2/6|
|SEC25|A11y|هدف WCAG 2.2 AA|manual + automated audit|6|
|SEC26|Dependencies|ثغرات وتراخيص|dependency audit|7|
|SEC27|CI/CD|Actions SHA pinning وأقل صلاحيات|workflow review|7|
|SEC28|CI/CD|secret scan وSAST ملائم|CI logs|7|
|SEC29|Supply chain|SBOM عند توزيع binaries/images|SBOM artifact|7/حسب الانطباق|
|SEC30|Errors|لا stack traces/secrets للمستخدم|error tests|2–6|

لكل بند في التنفيذ أضف Applicable، Implementation، Evidence، Status، Owner. الحالات: Not started / In progress / Verified / Exception.

## الاستثناءات
يلزم سبب وأثر ومخفف بديل ومالك وتاريخ انتهاء ومراجعة وموافقة بشرية. لا يعتمد AI Agent استثناء أنشأه بنفسه.

## حدود الادعاء
لا تقل «متوافق مع ASVS» أو «آمن بالكامل» أو «محصن» دون تدقيق وأدلة. الصياغة قبل ذلك: «نستخدم ASVS مرجعاً تخطيطياً، وهدفنا Level 2، ويجري التحقق بمصفوفة ضوابط واختبارات».
