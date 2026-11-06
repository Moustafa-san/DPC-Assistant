import { create } from "zustand";
import { SupportedCurrency } from "../types/common";
import { CostItem } from "../schemas/pricing";
import { reconcileInvoiceWithPayments } from "../invoice/calculator";
import { createLedgerEntry } from "../income/ledger";
import { generate3dLutCube } from "../palette/lut-generator";
import { generateSecureToken } from "../tokens/crypto";
import { Invoice, Payment, IncomeLedgerEntry } from "../schemas/invoice";
import { ColorPalette } from "../schemas/palette";
import { defaultProjectRepository, StoredProject } from "../repositories/project-repository";

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
  ownerId: string | null;

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
  loadForUser: (userId: string) => Promise<void>;
  saveActiveProject: () => Promise<void>;
  syncWithCloud: () => Promise<{ synced: number; conflicts: number; failed: number }>;
  setPaletteColors: (dominant: string, secondary: string, accent: string) => void;
  exportLutCube: () => string;
  recordPayment: (amountMinor: bigint, method: Payment["method"]) => void;
  toggleTask: (id: string) => void;
  createNewProject: (title?: string) => void;
  resetStore: () => void;
}

const INITIAL_EMPTY_STATE = {
  ownerId: null,
  projectId: "",
  projectTitle: "",
  projectType: "commercial",
  currency: "EGP" as SupportedCurrency,
  shootDate: "",
  deliveryDate: "",
  client: {
    id: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  },
  briefScope: "",
  briefRequirements: [] as string[],
  publicBriefToken: null,
  costItems: [] as CostItem[],
  markupPercentage: 0,
  discountMinor: 0n,
  taxPercentage: 0,
  shots: [] as ShotItem[],
  gearPackingList: [] as GearPackItem[],
  videoHours: 0,
  videoBitrateMbps: 0,
  photoCount: 0,
  photoAverageSizeMB: 0,
  safetyMarginPercentage: 20,
  cameraCount: 1,
  palette: {
    id: "",
    name: "",
    mood: "",
    dominantColor: "#2c3e50",
    secondaryColor: "#bdc3c7",
    accentColor: "#e74c3c",
  },
  locationName: "",
  latitude: 30.0444,
  longitude: 31.2357,
  crewCallTime: "",
  invoice: {
    id: "inv-placeholder",
    invoiceNumber: "INV-0000",
    ownerId: "owner-placeholder",
    projectId: "proj-placeholder",
    clientId: "client-placeholder",
    currency: "EGP" as SupportedCurrency,
    issueDate: "",
    dueDate: "",
    items: [
      {
        id: "item-init-1",
        description: "خدمات تصوير",
        quantity: 1,
        unitPriceMinor: 0n,
        totalPriceMinor: 0n,
      },
    ],
    subtotalMinor: 0n,
    discountMinor: 0n,
    taxPercentage: 0,
    taxAmountMinor: 0n,
    totalMinor: 0n,
    paidAmountMinor: 0n,
    balanceDueMinor: 0n,
    status: "draft" as const,
  },
  payments: [] as Payment[],
  ledgerEntries: [] as IncomeLedgerEntry[],
  tasks: [] as TaskItem[],
  operatingExpensesMinor: 0n,
  cameraPurchasePriceMinor: 0n,
  cameraUsefulHours: 2000,
  cameraUsedHours: 0,
  lensDailyRentalRateMinor: 0n,
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "uuid-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...INITIAL_EMPTY_STATE,

  resetStore: () => {
    set({ ...INITIAL_EMPTY_STATE });
  },

  createNewProject: (title = "مشروع تصوير جديد") => {
    const ownerId = get().ownerId;
    const newProjId = generateId();
    const newClientId = generateId();
    const newInvoiceId = generateId();
    const today = new Date().toISOString().split("T")[0];

    set({
      projectId: newProjId,
      projectTitle: title,
      projectType: "commercial",
      currency: "EGP",
      shootDate: today,
      deliveryDate: "",
      client: {
        id: newClientId,
        name: "عميل جديد",
        email: "",
        phone: "",
        company: "",
        notes: "",
      },
      invoice: {
        id: newInvoiceId,
        invoiceNumber: `INV-${new Date().getFullYear()}-0001`,
        ownerId: ownerId || "owner-local",
        projectId: newProjId,
        clientId: newClientId,
        currency: "EGP",
        issueDate: today,
        dueDate: today,
        items: [
          {
            id: generateId(),
            description: "خدمات تصوير فوتوغرافي وسينمائي",
            quantity: 1,
            unitPriceMinor: 0n,
            totalPriceMinor: 0n,
          },
        ],
        subtotalMinor: 0n,
        discountMinor: 0n,
        taxPercentage: 0,
        taxAmountMinor: 0n,
        totalMinor: 0n,
        paidAmountMinor: 0n,
        balanceDueMinor: 0n,
        status: "draft",
      },
    });

    if (ownerId) {
      get().saveActiveProject();
    }
  },

  loadForUser: async (userId: string) => {
    set({ ownerId: userId });
    try {
      const projects = await defaultProjectRepository.loadProjects(userId);
      if (projects.length > 0) {
        const p = projects[0];
        set({
          projectId: p.id,
          projectTitle: p.title,
          projectType: p.projectType,
          shootDate: p.shootDate || "",
          deliveryDate: p.deliveryDate || "",
          currency: (p.currency as SupportedCurrency) || "EGP",
        });
      } else {
        // First-time user: Initialize a fresh project for their studio
        get().createNewProject("مشروعي الأول");
      }
    } catch (err) {
      console.warn("[ProjectStore] loadForUser error:", err);
    }
  },

  saveActiveProject: async () => {
    const state = get();
    const ownerId = state.ownerId;
    if (!ownerId || !state.projectId) return;

    const stored: StoredProject = {
      id: state.projectId,
      ownerId: ownerId,
      clientId: state.client?.id || undefined,
      title: state.projectTitle || "مشروع تصوير",
      projectType: state.projectType || "commercial",
      status: "draft",
      currency: state.currency,
      shootDate: state.shootDate,
      deliveryDate: state.deliveryDate,
      notes: state.briefScope,
      version: 1,
      updatedAt: new Date().toISOString(),
      data: {
        costItems: state.costItems,
        shots: state.shots,
        palette: state.palette,
        invoice: state.invoice,
        payments: state.payments,
      },
    };

    try {
      await defaultProjectRepository.saveProject(stored);
    } catch (err) {
      console.warn("[ProjectStore] saveActiveProject error:", err);
    }
  },

  syncWithCloud: async () => {
    const ownerId = get().ownerId;
    if (!ownerId) return { synced: 0, conflicts: 0, failed: 0 };
    return await defaultProjectRepository.syncPendingQueue(ownerId);
  },

  setProjectDetails: (details) => {
    set((state) => ({ ...state, ...details }));
    get().saveActiveProject();
  },

  generateBriefPublicLink: () => {
    const { rawToken } = generateSecureToken(72);
    set({ publicBriefToken: rawToken });
    get().saveActiveProject();
    return rawToken;
  },

  addCostItem: (item) => {
    set((state) => ({
      costItems: [...state.costItems, item],
    }));
    get().saveActiveProject();
  },

  removeCostItem: (id) => {
    set((state) => ({
      costItems: state.costItems.filter((i) => i.id !== id),
    }));
    get().saveActiveProject();
  },

  setMarkupPercentage: (pct) => {
    set({ markupPercentage: pct });
    get().saveActiveProject();
  },

  toggleShotCompleted: (id) => {
    set((state) => ({
      shots: state.shots.map((s) => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s)),
    }));
    get().saveActiveProject();
  },

  toggleGearPacked: (id) => {
    set((state) => ({
      gearPackingList: state.gearPackingList.map((g) =>
        g.id === id ? { ...g, isPacked: !g.isPacked } : g
      ),
    }));
    get().saveActiveProject();
  },

  setStorageInputs: (inputs) => {
    set((state) => ({ ...state, ...inputs }));
    get().saveActiveProject();
  },

  setPaletteColors: (dominant, secondary, accent) => {
    set((state) => ({
      palette: {
        ...state.palette,
        dominantColor: dominant,
        secondaryColor: secondary,
        accentColor: accent,
      },
    }));
    get().saveActiveProject();
  },

  exportLutCube: () => {
    const palette = get().palette;
    return generate3dLutCube(palette, {
      title: palette.name || "CineLUT",
      size: 17,
      contrast: 1.0,
      saturation: 1.0,
      warmth: 0.0,
    });
  },

  recordPayment: (amountMinor, method) => {
    const state = get();
    const paymentId = generateId();
    const idempotencyKey = `pay-${state.projectId}-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newPayment: Payment = {
      id: paymentId,
      invoiceId: state.invoice.id,
      amountMinor,
      currency: state.currency,
      paidAt: nowIso,
      method,
      idempotencyKey,
    };

    const updatedPayments = [...state.payments, newPayment];
    const { reconciledInvoice } = reconcileInvoiceWithPayments(state.invoice, updatedPayments);
    const newLedgerEntry = createLedgerEntry(newPayment, reconciledInvoice);

    set({
      invoice: reconciledInvoice,
      payments: updatedPayments,
      ledgerEntries: [...state.ledgerEntries, newLedgerEntry],
    });

    get().saveActiveProject();
  },

  toggleTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
    }));
    get().saveActiveProject();
  },
}));
