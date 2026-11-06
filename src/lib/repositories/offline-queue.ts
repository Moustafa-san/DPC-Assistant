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

const STORAGE_PREFIX = "dpc_assistant_offline_queue_";

/**
 * Account-Isolated Durable Offline Operation Queue.
 * Backed by persistent browser storage (localStorage / IndexedDB) to survive page reloads and browser restarts.
 * Ensures that offline modifications are strictly segregated per user account,
 * preventing data leakage on shared devices when multiple photographers log in (ADR-004).
 */
export class OfflineQueueManager {
  private queue: Map<string, OfflineOperation[]> = new Map();
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private getStorageKey(userId: string): string {
    return `${STORAGE_PREFIX}${userId}`;
  }

  private loadFromStorage(userId: string): OfflineOperation[] {
    if (this.queue.has(userId)) {
      return this.queue.get(userId)!;
    }

    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem(this.getStorageKey(userId));
        if (stored) {
          const parsed = JSON.parse(stored) as OfflineOperation[];
          this.queue.set(userId, parsed);
          return parsed;
        }
      } catch (err) {
        console.error("[OfflineQueue] Error reading storage:", err);
      }
    }

    const empty: OfflineOperation[] = [];
    this.queue.set(userId, empty);
    return empty;
  }

  private persistToStorage(userId: string, ops: OfflineOperation[]): void {
    this.queue.set(userId, ops);
    if (this.isBrowser) {
      try {
        localStorage.setItem(this.getStorageKey(userId), JSON.stringify(ops));
      } catch (err) {
        console.error("[OfflineQueue] Error persisting to storage:", err);
      }
    }
  }

  /**
   * Enqueues an offline mutation for a specific authenticated user and persists it durably.
   */
  public enqueue(operation: OfflineOperation): void {
    const { userId } = operation;
    if (!userId) {
      throw new Error("لا يمكن حفظ عملية دون اتصال بدون معرف مستخدم مصادق عليه");
    }

    const userOperations = [...this.loadFromStorage(userId)];
    
    // Check idempotency: do not re-enqueue existing operationId
    const existingIndex = userOperations.findIndex((op) => op.operationId === operation.operationId);
    if (existingIndex >= 0) {
      userOperations[existingIndex] = operation;
    } else {
      userOperations.push(operation);
    }

    this.persistToStorage(userId, userOperations);
  }

  /**
   * Retrieves pending operations strictly for the given user from durable storage.
   */
  public getPendingOperations(userId: string): OfflineOperation[] {
    const userOperations = this.loadFromStorage(userId);
    return userOperations.filter((op) => op.syncStatus === "pending");
  }

  /**
   * Marks an operation as successfully synced to the cloud and updates durable storage.
   */
  public markSynced(userId: string, operationId: string): void {
    const userOperations = [...this.loadFromStorage(userId)];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "synced";
      this.persistToStorage(userId, userOperations);
    }
  }

  /**
   * Marks an operation as having a conflict requiring user intervention.
   */
  public markConflict(userId: string, operationId: string, conflictDetails: string): void {
    const userOperations = [...this.loadFromStorage(userId)];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "conflict";
      op.conflictDetails = conflictDetails;
      this.persistToStorage(userId, userOperations);
    }
  }

  /**
   * Clears the entire queue for a user on explicit sign-out to prevent data contamination.
   */
  public clearUserQueue(userId: string): void {
    this.queue.delete(userId);
    if (this.isBrowser) {
      try {
        localStorage.removeItem(this.getStorageKey(userId));
      } catch (err) {
        console.error("[OfflineQueue] Error clearing storage:", err);
      }
    }
  }

  /**
   * Alias for clearUserQueue to purge device cache on logout.
   */
  public purgeUserData(userId: string): void {
    this.clearUserQueue(userId);
  }

  /**
   * Retrieves all operations count for telemetry/diagnostics.
   */
  public getQueueSummary(userId: string): { pending: number; synced: number; conflict: number } {
    const ops = this.loadFromStorage(userId);
    return {
      pending: ops.filter((o) => o.syncStatus === "pending").length,
      synced: ops.filter((o) => o.syncStatus === "synced").length,
      conflict: ops.filter((o) => o.syncStatus === "conflict").length,
    };
  }
}
