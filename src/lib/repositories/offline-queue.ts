export type SyncStatus = "pending" | "synced" | "conflict" | "failed";
export type EntityType = "project" | "client" | "shotlist" | "invoice" | "payment" | "asset";

export interface OfflineOperation {
  operationId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: "create" | "update" | "delete";
  payload: Record<string, unknown>;
  baseVersion: number;
  createdAt: string;
  syncStatus: SyncStatus;
  conflictDetails?: string;
}

/**
 * Account-Isolated Offline Operation Queue.
 * Ensures that offline modifications are strictly segregated per user account,
 * preventing data leakage on shared devices when multiple photographers log in.
 */
export class OfflineQueueManager {
  private queue: Map<string, OfflineOperation[]> = new Map();

  /**
   * Enqueues an offline mutation for a specific authenticated user.
   */
  public enqueue(operation: OfflineOperation): void {
    const { userId } = operation;
    if (!userId) {
      throw new Error("لا يمكن حفظ عملية دون اتصال بدون معرف مستخدم مصادق عليه");
    }

    const userOperations = this.queue.get(userId) ?? [];
    
    // Check idempotency: do not re-enqueue existing operationId
    const existingIndex = userOperations.findIndex((op) => op.operationId === operation.operationId);
    if (existingIndex >= 0) {
      userOperations[existingIndex] = operation;
    } else {
      userOperations.push(operation);
    }

    this.queue.set(userId, userOperations);
  }

  /**
   * Retrieves pending operations strictly for the given user.
   */
  public getPendingOperations(userId: string): OfflineOperation[] {
    const userOperations = this.queue.get(userId) ?? [];
    return userOperations.filter((op) => op.syncStatus === "pending");
  }

  /**
   * Marks an operation as successfully synced to the cloud.
   */
  public markSynced(userId: string, operationId: string): void {
    const userOperations = this.queue.get(userId) ?? [];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "synced";
    }
  }

  /**
   * Marks an operation with a sync conflict.
   */
  public markConflict(userId: string, operationId: string, conflictDetails: string): void {
    const userOperations = this.queue.get(userId) ?? [];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "conflict";
      op.conflictDetails = conflictDetails;
    }
  }

  /**
   * Clears the queue and local cache for a specific user upon logout or cache wipe.
   * Prevents leaking User A data to User B on shared devices.
   */
  public purgeUserData(userId: string): void {
    this.queue.delete(userId);
  }

  /**
   * Verifies that no operations belonging to another user are accessible.
   */
  public verifyAccountIsolation(requestingUserId: string, targetUserId: string): boolean {
    return requestingUserId === targetUserId;
  }
}
