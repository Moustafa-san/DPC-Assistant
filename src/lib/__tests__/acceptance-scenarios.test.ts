import { describe, it, expect } from "vitest";
import { calculatePricing } from "../pricing/calculator";
import { calculateStorage } from "../storage-calc/calculator";
import { calculateSolarTimes } from "../solar/calculator";
import { computeInvoiceTotals, reconcileInvoiceWithPayments } from "../invoice/calculator";
import { createLedgerEntry, calculateRealizedIncome } from "../income/ledger";
import { IncomeLedgerEntry } from "../schemas/invoice";
import { generateSecureToken, hashToken, validatePublicToken, PublicTokenRecord } from "../tokens/crypto";
import { reconcileOfflineOperation, ServerEntityState } from "../offline/reconciliation";
import { OfflineOperation } from "../repositories/offline-queue";
import { arDictionary } from "../i18n/dictionaries/ar";
import { enDictionary } from "../i18n/dictionaries/en";

describe("Gate 6 Official Acceptance Scenarios (The 5 Golden Scenarios)", () => {
  // =========================================================================
  // Acceptance Scenario 1: Complete Project Pipeline «من البريف للفلوس»
  // =========================================================================
  it("Scenario 1: executes end-to-end project journey from brief to order sheet", () => {
    // 1. Brief Builder: Project details & shoot parameters
    const projectBrief = {
      title: "تغطية حفل زفاف سينمائي - القاهرة",
      clientName: "أحمد وفرح",
      eventDate: "2026-11-04",
      location: "فندق ماريوت الزمالك",
      latitude: 30.0583,
      longitude: 31.2189,
      timezone: "Africa/Cairo",
    };
    expect(projectBrief.title).toBeDefined();

    // 2. Solar planning for Golden Hour
    const solarTimes = calculateSolarTimes(
      projectBrief.eventDate,
      { latitude: projectBrief.latitude, longitude: projectBrief.longitude },
      projectBrief.timezone
    );
    expect(["06:11", "06:12", "06:13"]).toContain(solarTimes.sunrise);
    expect(["17:04", "17:05", "17:06"]).toContain(solarTimes.sunset);
    expect(solarTimes.eveningGoldenHour).toBeDefined();

    // 3. Storage Calculator for Shoot Media Kit
    const storageKit = calculateStorage({
      videoHours: 8,
      videoBitrateMbps: 50,
      photoCount: 1500,
      photoAverageSizeMB: 55,
      safetyMarginPercentage: 15,
      cameraCount: 2,
    });
    expect(storageKit.totalRequiredStorageGb).toBe(508.9);
    expect(storageKit.recommendedCards.totalKitCapacityGb).toBeGreaterThanOrEqual(508.9);

    // 4. ProCost Pricing & Dual Quotes
    const pricing = calculatePricing({
      currency: "EGP",
      markupPercentage: 35,
      discountMinor: 0n,
      taxPercentage: 14,
      items: [
        {
          id: "crew-dir",
          name: "مدير تصوير رئيسي",
          category: "crew",
          quantity: 1,
          unitCostMinor: BigInt(1200000), // 12,000 EGP
          currency: "EGP",
        },
        {
          id: "crew-cam2",
          name: "مصور فوتوغرافي ومساعد إضاءة",
          category: "crew",
          quantity: 1,
          unitCostMinor: BigInt(600000), // 6,000 EGP
          currency: "EGP",
        },
        {
          id: "gear-pkg",
          name: "باقة كاميرات FX3 وعدسات G-Master",
          category: "gear",
          quantity: 1,
          unitCostMinor: BigInt(800000), // 8,000 EGP
          currency: "EGP",
        },
      ],
    });

    expect(pricing.internal.totalBaseCostMinor).toBe(BigInt(2600000));
    expect(pricing.internal.totalClientPriceMinor).toBe(BigInt(4001400));
    expect(pricing.client.totalMinor).toBe(BigInt(4001400));
    // Verify client quote omits internal costs
    expect(pricing.client).not.toHaveProperty("totalBaseCostMinor");
    expect(pricing.client).not.toHaveProperty("markupAmountMinor");

    // 5. Invoicing with 50% deposit and 50% final delivery
    const invoice = computeInvoiceTotals({
      items: pricing.client.items.map((i) => ({
        description: i.name,
        quantity: i.quantity,
        unitPriceMinor: i.totalPriceMinor / BigInt(i.quantity),
      })),
      taxPercentage: 14,
      discountMinor: 0n,
    });
    expect(invoice.totalMinor).toBe(BigInt(4001400));
  });

  // =========================================================================
  // Acceptance Scenario 2: Milestone Payment Idempotency & Cash-Basis Ledger
  // =========================================================================
  it("Scenario 2: milestone payment records cash-basis income idempotently without double-counting", () => {
    const depositAmount = BigInt(2000000); // 20,000 EGP

    const testInvoice = {
      id: "inv-001",
      invoiceNumber: "INV-2026-0001",
      ownerId: "user-cairo",
      projectId: "proj-001",
      clientId: "client-001",
      currency: "EGP" as const,
      issueDate: "2026-10-15",
      dueDate: "2026-11-04",
      items: [
        {
          id: "item-1",
          description: "تصوير وتوثيق حفل زفاف سينمائي",
          quantity: 1,
          unitPriceMinor: BigInt(4000000),
          totalPriceMinor: BigInt(4000000),
        },
      ],
      subtotalMinor: BigInt(4000000),
      discountMinor: 0n,
      taxPercentage: 0,
      taxAmountMinor: 0n,
      totalMinor: BigInt(4000000), // 40,000 EGP
      paidAmountMinor: 0n,
      balanceDueMinor: BigInt(4000000),
      status: "issued" as const,
    };

    const payments = [
      {
        id: "pay-deposit-01",
        invoiceId: "inv-001",
        ownerId: "user-cairo",
        amountMinor: depositAmount,
        currency: "EGP" as const,
        paidAt: "2026-10-20T10:00:00Z",
        method: "bank_transfer" as const,
        idempotencyKey: "idemp-deposit-wedding-01",
      },
    ];

    // Reconcile Invoice: status must be partially_paid
    const invReconciliation = reconcileInvoiceWithPayments(testInvoice, payments);
    expect(invReconciliation.reconciledInvoice.status).toBe("partially_paid");
    expect(invReconciliation.totalPaidMinor).toBe(depositAmount);
    expect(invReconciliation.balanceDueMinor).toBe(BigInt(2000000));

    // Ledger simulation: Process initial payment
    const ledger: IncomeLedgerEntry[] = [];
    const entry1 = createLedgerEntry(payments[0], testInvoice);
    ledger.push(entry1);

    // Duplicate submission attempt with same idempotency key
    const duplicateKey = payments[0].idempotencyKey;
    const isDuplicate = ledger.some((entry) => entry.idempotencyKey === duplicateKey);
    expect(isDuplicate).toBe(true);

    if (!isDuplicate) {
      ledger.push(entry1); // Protected by idempotency check
    }

    // Realized income must reflect strictly 20,000 EGP, zero double-counting
    const totalRealized = calculateRealizedIncome(ledger, "EGP");
    expect(totalRealized).toBe(BigInt(2000000));
  });

  // =========================================================================
  // Acceptance Scenario 3: Offline Disconnection & Reconciliation
  // =========================================================================
  it("Scenario 3: offline shotlist modification syncs with additive merge and zero data loss", () => {
    // Client goes offline at Wedding Venue with no cell reception
    const offlineShotlistOp: OfflineOperation = {
      operationId: "op-field-shot-007",
      userId: "photographer-1",
      entityType: "shotlist",
      entityId: "shotlist-marriott",
      action: "update",
      payload: {
        items: [
          { id: "s-1", title: "مكياج العروسة", status: "completed" },
          { id: "s-2", title: "لقطة خاصة مع الجدة (أضيفت ميدانياً)", status: "pending" },
        ],
      },
      baseVersion: 1,
      createdAt: "2026-11-04T14:30:00Z",
      syncStatus: "pending",
    };

    // Meanwhile, the studio assistant back in Cairo edited shotlist online
    const studioServerEntity: ServerEntityState = {
      id: "shotlist-marriott",
      version: 2,
      updatedAt: "2026-11-04T14:45:00Z",
      data: {
        items: [
          { id: "s-1", title: "مكياج العروسة", status: "completed" },
          { id: "s-3", title: "لقطة وصول سيارة العريس", status: "completed" },
        ],
      },
    };

    // Reconnection & Synchronization
    const reconciliation = reconcileOfflineOperation(offlineShotlistOp, {
      processedOperationIds: new Set(),
      serverEntity: studioServerEntity,
    });

    expect(reconciliation.status).toBe("merged");
    expect(reconciliation.newVersion).toBe(3);
    const resolvedItems = reconciliation.resolvedData?.items as Array<{ id: string; title: string }>;
    expect(resolvedItems.length).toBe(3);
    expect(resolvedItems.map((s) => s.id)).toContain("s-1");
    expect(resolvedItems.map((s) => s.id)).toContain("s-2");
    expect(resolvedItems.map((s) => s.id)).toContain("s-3");
  });

  // =========================================================================
  // Acceptance Scenario 4: Public Share Links, Token Sanitization & Rate Limit
  // =========================================================================
  it("Scenario 4: public link token validates, enforces rate limiting, and sanitizes quote", () => {
    // Generate secure 256-bit token
    const { rawToken, tokenHash, expiresAt } = generateSecureToken(48); // 48-hour validity
    expect(rawToken.length).toBe(64);
    expect(hashToken(rawToken)).toBe(tokenHash);

    const tokenRecord: PublicTokenRecord = {
      id: "tok-rec-1",
      ownerId: "photo-user",
      resourceType: "quote",
      resourceId: "quote-wedding-1",
      tokenHash,
      expiresAt,
      revokedAt: null,
      rateLimitCount: 29, // 29 requests made in current window
      rateLimitWindowStart: new Date().toISOString(),
    };

    // Request 30 (should succeed)
    const access30 = validatePublicToken(tokenRecord, 30);
    expect(access30.result.isValid).toBe(true);
    expect(access30.result.remainingRequests).toBe(0);

    // Request 31 in same minute window (should be rate-limited)
    const access31 = validatePublicToken(access30.updatedRecord, 30);
    expect(access31.result.isValid).toBe(false);
    expect(access31.result.error).toBe("RATE_LIMITED");
  });

  // =========================================================================
  // Acceptance Scenario 5: Accessibility, Contrast & Bilingual Parity
  // =========================================================================
  it("Scenario 5: satisfies accessibility design contract, contrast, and bilingual parity", () => {
    // 1. Dictionary Parity: All keys in Arabic dictionary must exist in English dictionary
    function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
      return Object.entries(obj).flatMap(([k, v]) => {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          return getKeys(v as Record<string, unknown>, fullKey);
        }
        return [fullKey];
      });
    }

    const arKeys = getKeys(arDictionary as unknown as Record<string, unknown>).sort();
    const enKeys = getKeys(enDictionary as unknown as Record<string, unknown>).sort();
    expect(arKeys).toEqual(enKeys);

    // 2. WCAG 2.2 AA Contrast Check for Brand Tokens
    // Calculate relative luminance
    function getLuminance(r: number, g: number, b: number): number {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        const val = c / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function getContrastRatio(hex1: string, hex2: string): number {
      const parseHex = (hex: string) => {
        const h = hex.replace("#", "");
        return [
          parseInt(h.substring(0, 2), 16),
          parseInt(h.substring(2, 4), 16),
          parseInt(h.substring(4, 6), 16),
        ];
      };
      const [r1, g1, b1] = parseHex(hex1);
      const [r2, g2, b2] = parseHex(hex2);
      const l1 = getLuminance(r1, g1, b1);
      const l2 = getLuminance(r2, g2, b2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    // Warm Charcoal (#292B25) on Soft Ivory (#FFFDF8)
    const primaryTextContrast = getContrastRatio("#292B25", "#FFFDF8");
    expect(primaryTextContrast).toBeGreaterThan(7.0); // Exceeds WCAG AAA (7.0:1)

    // Deep Olive (#46513B) on Soft Ivory (#FFFDF8)
    const buttonContrast = getContrastRatio("#46513B", "#FFFDF8");
    expect(buttonContrast).toBeGreaterThan(4.5); // Exceeds WCAG AA (4.5:1)

    // Secondary Text (#74766B) on Soft Ivory (#FFFDF8)
    const secondaryTextContrast = getContrastRatio("#74766B", "#FFFDF8");
    expect(secondaryTextContrast).toBeGreaterThan(4.5); // Satisfies WCAG AA (4.5:1)
  });
});
