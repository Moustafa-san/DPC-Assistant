import { create } from "zustand";
import { SupportedCurrency } from "../types/common";
import { CostItem } from "../schemas/pricing";
import { reconcileInvoiceWithPayments } from "../invoice/calculator";
import { createLedgerEntry } from "../income/ledger";
import { generate3dLutCube } from "../palette/lut-generator";
import { generateSecureToken } from "../tokens/crypto";
import { Invoice, Payment, IncomeLedgerEntry } from "../schemas/invoice";
import { ColorPalette } from "../schemas/palette";

export interface ShotItem {
  id: string;
  sceneNumber: string;
  shotNumber: string;
  description: string;
  framing: string;
  lens: string;
  isCompleted: boolean;
}

export interface GearPackItem {
  id: string;
  name: string;
  category: "camera" | "lens" | "lighting" | "audio" | "grip" | "accessories";
  isPacked: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  phase: "pre" | "shoot" | "post";
  isCompleted: boolean;
  dueDate?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

export interface ProjectState {
  // Active Project Core
  projectId: string;
  projectTitle: string;
  projectType: string;
  currency: SupportedCurrency;
  shootDate: string; // YYYY-MM-DD
  deliveryDate: string;
  client: ClientProfile;

  // 1. Brief
  briefScope: string;
  briefRequirements: string[];
  publicBriefToken: string | null;

  // 2. ProCost
  costItems: CostItem[];
  markupPercentage: number;
  discountMinor: bigint;
  taxPercentage: number;

  // 3. Pro Shotlist
  shots: ShotItem[];
  gearPackingList: GearPackItem[];

  // 4. Storage Calculator
  videoHours: number;
  videoBitrateMbps: number;
  photoCount: number;
  photoAverageSizeMB: number;
  safetyMarginPercentage: number;
  cameraCount: number;

  // 5. Cine Palette
  palette: ColorPalette;

  // 6. Calendar & Order Sheet
  locationName: string;
  latitude: number;
  longitude: number;
  crewCallTime: string;

  // 7. Pro Invoice & Ledger
  invoice: Invoice;
  payments: Payment[];
  ledgerEntries: IncomeLedgerEntry[];

  // Tasks & Business
  tasks: TaskItem[];
  operatingExpensesMinor: bigint;
  cameraPurchasePriceMinor: bigint;
  cameraUsefulHours: number;
  cameraUsedHours: number;
  lensDailyRentalRateMinor: bigint;

  // Actions
  setProjectDetails: (details: Partial<ProjectState>) => void;
  generateBriefPublicLink: () => string;
  addCostItem: (item: CostItem) => void;
  removeCostItem: (id: string) => void;
  setMarkupPercentage: (pct: number) => void;
  toggleShotCompleted: (id: string) => void;
  toggleGearPacked: (id: string) => void;
  setStorageInputs: (inputs: Partial<ProjectState>) => void;
  setPaletteColors: (dominant: string, secondary: string, accent: string) => void;
  exportLutCube: () => string;
  recordPayment: (amountMinor: bigint, method: Payment["method"]) => void;
  toggleTask: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: "proj-cairo-wedding-2026",
  projectTitle: "حفل زفاف القاهرة الفاخر",
  projectType: "Wedding & Cinematic Video",
  currency: "EGP",
  shootDate: "2026-11-04",
  deliveryDate: "2026-11-20",
  client: {
    id: "client-1",
    name: "كريم ونور النجار",
    email: "kareem.nour@example.com",
    phone: "+20 100 123 4567",
    company: "عائلة النجار",
    notes: "تغطية كاملة من مرحلة التجهيزات وحتى انتهاء الحفل، مع التركيز على لقطات السينما 4K والضوء الطبيعي.",
  },

  // 1. Brief
  briefScope: "تغطية سينمائية كاملة تتضمن فيديو ملخص 5 دقائق بدقة 4K، فيديو توثيقي كامل 45 دقيقة، وتصوير فوتوغرافي لـ 1,500 لقطة خام.",
  briefRequirements: [
    "كاميرتان سينمائيتان للتغطية التزامنية",
    "تصوير في الساعة الذهبية قبل الغروب",
    "تسليم نسخة الألبوم الجلدي الفاخر",
    "توفير كروت ذاكرة احتياطية بهامش 15%",
  ],
  publicBriefToken: null,

  // 2. ProCost items
  costItems: [
    {
      id: "item-1",
      name: "طاقم التصوير (مصور رئيسي + مصور مساعد)",
      category: "crew",
      quantity: 1,
      unitCostMinor: BigInt(1200000), // 12,000 EGP
      currency: "EGP",
    },
    {
      id: "item-2",
      name: "إيجار عدسات سينمائية ومعدات إضاءة محمولة",
      category: "gear",
      quantity: 1,
      unitCostMinor: BigInt(600000), // 6,000 EGP
      currency: "EGP",
    },
    {
      id: "item-3",
      name: "مونتاج، تصحيح ألوان Cine Palette وتعديل الصور",
      category: "post_production",
      quantity: 1,
      unitCostMinor: BigInt(800000), // 8,000 EGP
      currency: "EGP",
    },
  ],
  markupPercentage: 35, // 35% Markup on cost
  discountMinor: 0n,
  taxPercentage: 14, // 14% VAT

  // 3. Pro Shotlist
  shots: [
    {
      id: "shot-1",
      sceneNumber: "المشهد 1",
      shotNumber: "لقطة 1A",
      description: "لقطة قريبة (Close-Up) لتفاصيل الفستان والمجوهرات في إضاءة النافذة الهادئة",
      framing: "Close-Up",
      lens: "85mm f/1.4",
      isCompleted: true,
    },
    {
      id: "shot-2",
      sceneNumber: "المشهد 1",
      shotNumber: "لقطة 1B",
      description: "لقطة واسعة (Wide Shot) لجلسة التجهيز الأولى مع انعكاس المرآة",
      framing: "Wide",
      lens: "35mm f/1.4",
      isCompleted: true,
    },
    {
      id: "shot-3",
      sceneNumber: "المشهد 2",
      shotNumber: "لقطة 2A",
      description: "اللقاء الأول (First Look) في الحديقة الخارجية وقت الساعة الذهبية",
      framing: "Medium Long Shot",
      lens: "50mm f/1.2",
      isCompleted: false,
    },
    {
      id: "shot-4",
      sceneNumber: "المشهد 3",
      shotNumber: "لقطة 3A",
      description: "دخول القاعة والرقصة الأولى مع إضاءة البقعة وتأثير السينما",
      framing: "Full Shot & Gimbal tracking",
      lens: "24-70mm f/2.8",
      isCompleted: false,
    },
  ],
  gearPackingList: [
    { id: "gear-1", name: "كاميرا Sony FX3 الأساسية", category: "camera", isPacked: true },
    { id: "gear-2", name: "كاميرا Sony A7IV الاحتياطية", category: "camera", isPacked: true },
    { id: "gear-3", name: "عدسة 24-70mm f/2.8 GM II", category: "lens", isPacked: true },
    { id: "gear-4", name: "عدسة 85mm f/1.4 GM", category: "lens", isPacked: true },
    { id: "gear-5", name: "مانع اهتزاز DJI RS3 Pro", category: "grip", isPacked: true },
    { id: "gear-6", name: "إضاءة محمولة Aputure 60x", category: "lighting", isPacked: false },
    { id: "gear-7", name: "كروت ذاكرة CFexpress / SD (عدد 6 كروت)", category: "accessories", isPacked: true },
  ],

  // 4. Storage Calculator
  videoHours: 8,
  videoBitrateMbps: 50,
  photoCount: 1500,
  photoAverageSizeMB: 55,
  safetyMarginPercentage: 15,
  cameraCount: 2,

  // 5. Cine Palette
  palette: {
    id: "pal-wedding-cairo",
    name: "Cairo Golden Hour",
    mood: "Warm Editorial & Vintage Warmth",
    dominantColor: "#F6F2E9",
    secondaryColor: "#46513B",
    accentColor: "#A8875B",
  },

  // 6. Calendar & Order Sheet
  locationName: "حديقة فندق الجزيرة — القاهرة",
  latitude: 30.0444,
  longitude: 31.2357,
  crewCallTime: "14:00",

  // 7. Pro Invoice & Ledger
  invoice: {
    id: "inv-2026-001",
    invoiceNumber: "INV-2026-001",
    ownerId: "user-1",
    projectId: "proj-cairo-wedding-2026",
    clientId: "client-1",
    currency: "EGP",
    issueDate: "2026-11-01",
    dueDate: "2026-11-15",
    items: [
      {
        id: "item-1",
        description: "باقة التصوير السينمائي الكاملة (فيديو 4K وفوتوغرافية)",
        quantity: 1,
        unitPriceMinor: BigInt(3510000), // 35,100 EGP (base 26,000 + 35% markup)
        totalPriceMinor: BigInt(3510000),
      },
    ],
    subtotalMinor: BigInt(3510000),
    discountMinor: 0n,
    taxPercentage: 14,
    taxAmountMinor: BigInt(491400), // 14% of 35,100 = 4,914 EGP
    totalMinor: BigInt(4001400), // 40,014 EGP
    paidAmountMinor: BigInt(1500000), // 15,000 EGP deposit collected
    balanceDueMinor: BigInt(2501400), // 25,014 EGP remaining
    status: "partially_paid",
  },
  payments: [
    {
      id: "pay-deposit-01",
      invoiceId: "inv-2026-001",
      amountMinor: BigInt(1500000), // 15,000 EGP
      currency: "EGP",
      paidAt: "2026-11-01T15:00:00Z",
      method: "instapay",
      idempotencyKey: "idem-wedding-deposit-001",
      notes: "عربون تأكيد الحجز وحجز الموعد",
    },
  ],
  ledgerEntries: [
    {
      id: "ledger-pay-deposit-01",
      paymentId: "pay-deposit-01",
      invoiceId: "inv-2026-001",
      projectId: "proj-cairo-wedding-2026",
      amountMinor: BigInt(1500000),
      currency: "EGP",
      recognizedAt: "2026-11-01T15:00:00Z",
      idempotencyKey: "idem-wedding-deposit-001",
    },
  ],

  // Tasks & Business
  tasks: [
    { id: "t-1", title: "مراجعة متطلبات البريف وتأكيد أماكن التصوير", phase: "pre", isCompleted: true },
    { id: "t-2", title: "فحص شحن البطاريات ومسح كروت الذاكرة", phase: "pre", isCompleted: true },
    { id: "t-3", title: "تأكيد موعد الحضور وورقة الأوردر مع طاقم المساعدين", phase: "pre", isCompleted: true },
    { id: "t-4", title: "تنفيذ لقطات الساعة الذهبية حسب مواقيت NOAA", phase: "shoot", isCompleted: false },
    { id: "t-5", title: "أخذ نسخة احتياطية فورية على وسيطي تخزين منفصلين", phase: "shoot", isCompleted: false },
    { id: "t-6", title: "فرز وتصفية 1,500 لقطة خام وتطبيق لوحة الألوان", phase: "post", isCompleted: false },
    { id: "t-7", title: "إصدار المطالبة النهائية وتحصيل باقي الفاتورة", phase: "post", isCompleted: false },
  ],
  operatingExpensesMinor: BigInt(450000), // 4,500 EGP expenses
  cameraPurchasePriceMinor: BigInt(6000000), // 60,000 EGP
  cameraUsefulHours: 1000,
  cameraUsedHours: 250,
  lensDailyRentalRateMinor: BigInt(200000), // 2,000 EGP

  // Action Implementations
  setProjectDetails: (details) => set((state) => ({ ...state, ...details })),

  generateBriefPublicLink: () => {
    const { rawToken } = generateSecureToken(72);
    set({ publicBriefToken: rawToken });
    return rawToken;
  },

  addCostItem: (item) =>
    set((state) => ({
      costItems: [...state.costItems, item],
    })),

  removeCostItem: (id) =>
    set((state) => ({
      costItems: state.costItems.filter((item) => item.id !== id),
    })),

  setMarkupPercentage: (pct) => set({ markupPercentage: pct }),

  toggleShotCompleted: (id) =>
    set((state) => ({
      shots: state.shots.map((shot) =>
        shot.id === id ? { ...shot, isCompleted: !shot.isCompleted } : shot
      ),
    })),

  toggleGearPacked: (id) =>
    set((state) => ({
      gearPackingList: state.gearPackingList.map((g) =>
        g.id === id ? { ...g, isPacked: !g.isPacked } : g
      ),
    })),

  setStorageInputs: (inputs) => set((state) => ({ ...state, ...inputs })),

  setPaletteColors: (dominant, secondary, accent) =>
    set((state) => ({
      palette: {
        ...state.palette,
        dominantColor: dominant,
        secondaryColor: secondary,
        accentColor: accent,
      },
    })),

  exportLutCube: () => {
    const state = get();
    return generate3dLutCube(state.palette, {
      title: state.palette.name.replace(/\s+/g, "_"),
      size: 17,
      contrast: 1.1,
      saturation: 1.05,
      warmth: 0.2,
    });
  },

  recordPayment: (amountMinor, method) => {
    const state = get();
    const newPaymentId = `pay-${Date.now()}`;
    const newPayment: Payment = {
      id: newPaymentId,
      invoiceId: state.invoice.id,
      amountMinor,
      currency: state.currency,
      paidAt: new Date().toISOString(),
      method,
      idempotencyKey: `idem-key-${newPaymentId}`,
    };

    const updatedPayments = [...state.payments, newPayment];
    const { reconciledInvoice } = reconcileInvoiceWithPayments(state.invoice, updatedPayments);
    const newLedgerEntry = createLedgerEntry(newPayment, reconciledInvoice);

    set({
      invoice: reconciledInvoice,
      payments: updatedPayments,
      ledgerEntries: [...state.ledgerEntries, newLedgerEntry],
    });
  },

  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      ),
    })),
}));
