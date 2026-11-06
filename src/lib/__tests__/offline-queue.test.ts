import { describe, it, expect, beforeEach } from "vitest";
import { OfflineQueueManager, OfflineOperation } from "../repositories/offline-queue";

describe("Account-Isolated Offline Operation Queue (Commit 10)", () => {
  let queueManager: OfflineQueueManager;

  const userA = "user-1111-cairo";
  const userB = "user-2222-alex";

  beforeEach(() => {
    queueManager = new OfflineQueueManager();
  });

  it("enqueues operations and isolates pending changes strictly per user account", async () => {
    const opUserA: OfflineOperation = {
      operationId: "op-1",
      userId: userA,
      entityType: "shotlist",
      entityId: "shotlist-1",
      action: "update",
      payload: { completedShots: [1, 2, 3] },
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    const opUserB: OfflineOperation = {
      operationId: "op-2",
      userId: userB,
      entityType: "invoice",
      entityId: "inv-2",
      action: "create",
      payload: { invoiceNumber: "INV-B-001" },
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    await queueManager.enqueue(opUserA);
    await queueManager.enqueue(opUserB);

    // User A can only see op-1
    const pendingA = await queueManager.getPendingOperations(userA);
    expect(pendingA.length).toBe(1);
    expect(pendingA[0].operationId).toBe("op-1");

    // User B can only see op-2
    const pendingB = await queueManager.getPendingOperations(userB);
    expect(pendingB.length).toBe(1);
    expect(pendingB[0].operationId).toBe("op-2");
  });

  it("tracks sync status transitions accurately (pending -> synced)", async () => {
    const op: OfflineOperation = {
      operationId: "op-sync-1",
      userId: userA,
      entityType: "client",
      entityId: "client-1",
      action: "create",
      payload: { name: "Ahmed Nour" },
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    await queueManager.enqueue(op);
    expect((await queueManager.getPendingOperations(userA)).length).toBe(1);

    // Mark as successfully synced
    await queueManager.markSynced(userA, "op-sync-1");
    expect((await queueManager.getPendingOperations(userA)).length).toBe(0);
  });

  it("purges user data upon account logout to prevent data leakage on shared devices", async () => {
    const op: OfflineOperation = {
      operationId: "op-shared-1",
      userId: userA,
      entityType: "project",
      entityId: "proj-secret",
      action: "update",
      payload: { secretNotes: "VIP wedding" },
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    await queueManager.enqueue(op);
    expect((await queueManager.getPendingOperations(userA)).length).toBe(1);

    // User logs out and clears their cached device data
    queueManager.purgeUserData(userA, true);
    expect((await queueManager.getPendingOperations(userA)).length).toBe(0);
  });
});
