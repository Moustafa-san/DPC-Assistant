export const arDictionary = {
  common: {
    appName: "مساعد المصور",
    tagline: "من البريف للفلوس — كل أدوات شغلك في مكان واحد",
    startNow: "ابدأ الآن",
    exploreTools: "استكشف الأدوات",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب جديد",
    signOut: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    projects: "المشروعات",
    settings: "الإعدادات",
    language: "اللغة",
    arabic: "العربية",
    english: "English",
    loading: "جاري التحميل...",
    emptyState: "لا توجد بيانات حالياً",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    offlineBadge: "العمل دون اتصال",
    syncedBadge: "تمت المزامنة",
  },
  navigation: {
    home: "الرئيسية",
    brief: "البريف",
    cost: "التسعير",
    shotlist: "قائمة اللقطات",
    storage: "حاسبة التخزين",
    palette: "لوحة الألوان",
    calendar: "التقويم والأوردر",
    invoice: "الفواتير",
    crm: "العملاء",
    tasks: "المهام",
    business: "مؤشرات الأعمال",
  },
  landing: {
    heroTitle: "نظام تشغيل متكامل للمصور المستقل وصانع الفيديو",
    heroSubtitle: "أدِر طلبات التصوير، حسابات التكلفة، قوائم اللقطات، ورقة الأوردر، والفواتير والربحية في مسار عمل متصل واحد.",
    valueProp1Title: "مسار عمل غير منقطع",
    valueProp1Desc: "ربط حقيقي يبدأ من استقبال رغبات العميل وحتى إصدار الفاتورة وتحصيل الدخل.",
    valueProp2Title: "حسابات مالية موثوقة",
    valueProp2Desc: "تسعير دقيق بهامش أمان، فصل صارم للعملات، ودون أخطاء تقريب عشوائية.",
    valueProp3Title: "خصوصية وتحكم كامل",
    valueProp3Desc: "بياناتك ملكك بالكامل. مجاني ومفتوح المصدر بدون اشتراكات أو بيع بيانات أو إعلانات.",
    toolsTitle: "الأدوات السبع الأساسية",
    toolsSubtitle: "أدوات مصممة خصيصاً لتلائم لغة واحتياجات المصور المحترف.",
    ctaTitle: "جاهز لتنظيم عملك الفني والتجاري؟",
    ctaSubtitle: "ابدأ الآن مجاناً وامتلك التحكم الكامل في مسار مشروعاتك.",
  },
  auth: {
    welcomeBack: "مرحباً بعودتك",
    createAccount: "أنشئ حسابك المهني",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    googleSignIn: "المتابعة باستخدام Google",
    alreadyHaveAccount: "لديك حساب بالفعل؟ سجل دخولك",
    dontHaveAccount: "ليس لديك حساب؟ أنشئ حسابك الآن",
    forgotPassword: "هل نسيت كلمة المرور؟",
  },
  shell: {
    workspaceTitle: "مساحة عمل المشروع",
    activeProjects: "المشروعات النشطة",
    newProject: "مشروع جديد",
  },
} as const;

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? DeepStringRecord<T[K]>
    : string;
};

export type Dictionary = DeepStringRecord<typeof arDictionary>;

