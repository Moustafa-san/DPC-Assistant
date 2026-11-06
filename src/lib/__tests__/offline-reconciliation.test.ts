import { describe, it, expect } from "vitest";
import { reconcileOfflineOperation, ServerEntityState } from "../offline/reconciliation";
import { OfflineOperation } from "../repositories/offline-queue";

describe("ADR-011 Offline Reconciliation & Conflict Handling", () => {
  it("detects and acknowledges idempotent duplicates", () => {
    const op: OfflineOperation = {
      operationId: "op-101",
      userId: "user-1",
      entityType: "shotlist",
      entityId: "shotlist-1",
      action: "update",
      payload: { title: "Updated Offline" },
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const serverEntity: ServerEntityState = {
      id: "shotlist-1",
      version: 2,
      updatedAt: new Date().toISOString(),
      data: { title: "Server Title" },
    };

    const res = reconcileOfflineOperation(op, {
      processedOperationIds: new Set(["op-101"]),
      serverEntity,
    });

    expect(res.status).toBe("idempotent_duplicate");
    expect(res.entityId).toBe("shotlist-1");
  });

  it("strictly prohibits Last-Write-Wins (LWW) on financial invoices when version mismatches", () => {
    const op: OfflineOperation = {
      operationId: "op-invoice-1",
      userId: "user-1",
      entityType: "invoice",
      entityId: "inv-2026-0001",
      action: "update",
      payload: { status: "paid" },
      baseVersion: 1, // Client thought it was v1
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const serverEntity: ServerEntityState = {
      id: "inv-2026-0001",
      version: 2, // Server is already at v2 (e.g., partial payment recorded from another device)
      updatedAt: new Date().toISOString(),
      data: { status: "partially_paid", paidMinor: 500000 },
    };

    const res = reconcileOfflineOperation(op, {
      processedOperationIds: new Set(),
      serverEntity,
    });

    expect(res.status).toBe("conflict_requires_user_action");
    expect(res.conflictReason).toBe("FINANCIAL_VERSION_MISMATCH_NO_LWW");
  });

  it("rejects deletion of financial records", () => {
    const op: OfflineOperation = {
      operationId: "op-del-inv",
      userId: "user-1",
      entityType: "payment",
      entityId: "pay-1",
      action: "delete",
      payload: {},
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const serverEntity: ServerEntityState = {
      id: "pay-1",
      version: 1,
      updatedAt: new Date().toISOString(),
      data: { amountMinor: 200000 },
    };

    const res = reconcileOfflineOperation(op, {
      processedOperationIds: new Set(),
      serverEntity,
    });

    expect(res.status).toBe("rejected");
    expect(res.conflictReason).toBe("FINANCIAL_DELETION_PROHIBITED");
  });

  it("performs additive merge on shotlists without losing offline or online shots", () => {
    const op: OfflineOperation = {
      operationId: "op-shot-add",
      userId: "user-1",
      entityType: "shotlist",
      entityId: "shotlist-100",
      action: "update",
      payload: {
        items: [
          { id: "shot-1", title: "دخول العروسين", completed: true },
          { id: "shot-3", title: "لقطة البوفيه (أضيفت أوفلاين)", completed: false },
        ],
      },
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const serverEntity: ServerEntityState = {
      id: "shotlist-100",
      version: 2,
      updatedAt: new Date().toISOString(),
      data: {
        items: [
          { id: "shot-1", title: "دخول العروسين", completed: false },
          { id: "shot-2", title: "الرقصة الأولى (أضيفت أونلاين)", completed: true },
        ],
      },
    };

    const res = reconcileOfflineOperation(op, {
      processedOperationIds: new Set(),
      serverEntity,
    });

    expect(res.status).toBe("merged");
    expect(res.newVersion).toBe(3);
    const items = res.resolvedData?.items as Array<{ id: string; title: string }>;
    expect(items.length).toBe(3);
    expect(items.map((i) => i.id)).toEqual(["shot-1", "shot-2", "shot-3"]);
  });

  it("applies optimistic concurrency cleanly when versions match", () => {
    const op: OfflineOperation = {
      operationId: "op-proj-clean",
      userId: "user-1",
      entityType: "project",
      entityId: "proj-1",
      action: "update",
      payload: { title: "عنوان المشروع المحدث" },
      baseVersion: 3,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const serverEntity: ServerEntityState = {
      id: "proj-1",
      version: 3,
      updatedAt: new Date().toISOString(),
      data: { title: "العنوان القديم", location: "القاهرة" },
    };

    const res = reconcileOfflineOperation(op, {
      processedOperationIds: new Set(),
      serverEntity,
    });

    expect(res.status).toBe("applied");
    expect(res.newVersion).toBe(4);
    expect(res.resolvedData?.title).toBe("عنوان المشروع المحدث");
    expect(res.resolvedData?.location).toBe("القاهرة");
  });
});
