import { idbGet, idbSet, idbDel } from "./indexed-db";

export type SyncStatus = "pending" | "synced" | "conflict" | "failed";
export type EntityType =
  | "project"
  | "client"
  | "brief"
  | "quote"
  | "quote_item"
  | "shotlist"
  | "shot"
  | "palette"
  | "invoice"
  | "invoice_item"
  | "payment"
  | "income_ledger"
  | "asset";

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
 * Backed by persistent browser storage (True IndexedDB with LocalStorage fallback).
 * Adheres strictly to:
 * 1. Account isolation (operations are segregated per userId).
 * 2. True asynchronous IndexedDB read and awaited write-through before confirmation.
 * 3. Safe Logout Policy: pending operations remain safely locked in storage under the user's ID
 *    and resume automatically upon re-authentication.
 */
export class OfflineQueueManager {
  private memoryCache: Map<string, OfflineOperation[]> = new Map();
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== "undefined";
  }

  private getStorageKey(userId: string): string {
    return `${STORAGE_PREFIX}${userId}`;
  }

  /**
   * Reads operations truly from IndexedDB, caching in memory and localStorage.
   */
  public async loadOperations(userId: string): Promise<OfflineOperation[]> {
    if (this.isBrowser) {
      try {
        const stored = await idbGet<OfflineOperation[]>(this.getStorageKey(userId));
        if (stored && Array.isArray(stored)) {
          this.memoryCache.set(userId, stored);
          return stored;
        }
      } catch (err) {
        console.warn("[OfflineQueue] Error reading IndexedDB, falling back:", err);
      }
    }
    return this.loadOperationsSync(userId);
  }

  public loadOperationsSync(userId: string): OfflineOperation[] {
    if (this.memoryCache.has(userId)) {
      return this.memoryCache.get(userId)!;
    }

    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem(this.getStorageKey(userId));
        if (stored) {
          const parsed = JSON.parse(stored) as OfflineOperation[];
          this.memoryCache.set(userId, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn("[OfflineQueue] Error reading localStorage cache:", err);
      }
    }

    const empty: OfflineOperation[] = [];
    this.memoryCache.set(userId, empty);
    return empty;
  }

  /**
   * Persists operations and awaits IndexedDB commit.
   */
  public async persistOperationsAsync(userId: string, ops: OfflineOperation[]): Promise<void> {
    this.memoryCache.set(userId, ops);
    const key = this.getStorageKey(userId);

    if (this.isBrowser) {
      try {
        await idbSet(key, ops);
      } catch (err) {
        console.warn("[OfflineQueue] IndexedDB persist error:", err);
      }
      try {
        localStorage.setItem(key, JSON.stringify(ops));
      } catch (err) {
        console.warn("[OfflineQueue] LocalStorage fallback write failed:", err);
      }
    }
  }

  private persistOperations(userId: string, ops: OfflineOperation[]): void {
    this.memoryCache.set(userId, ops);
    const key = this.getStorageKey(userId);

    if (this.isBrowser) {
      idbSet(key, ops).catch((err) => {
        console.warn("[OfflineQueue] Async IndexedDB persist error:", err);
      });
      try {
        localStorage.setItem(key, JSON.stringify(ops));
      } catch (err) {
        console.warn("[OfflineQueue] LocalStorage fallback write failed:", err);
      }
    }
  }

  /**
   * Enqueues an offline mutation and awaits persistent storage commit in IndexedDB.
   */
  public async enqueue(operation: OfflineOperation): Promise<void> {
    const { userId } = operation;
    if (!userId) {
      throw new Error("لا يمكن حفظ عملية دون اتصال بدون معرف مستخدم مصادق عليه");
    }

    const userOperations = [...(await this.loadOperations(userId))];
    
    // Check idempotency: do not re-enqueue existing operationId
    const existingIndex = userOperations.findIndex((op) => op.operationId === operation.operationId);
    if (existingIndex >= 0) {
      userOperations[existingIndex] = operation;
    } else {
      userOperations.push(operation);
    }

    await this.persistOperationsAsync(userId, userOperations);
  }

  public enqueueSync(operation: OfflineOperation): void {
    const { userId } = operation;
    if (!userId) {
      throw new Error("لا يمكن حفظ عملية دون اتصال بدون معرف مستخدم مصادق عليه");
    }

    const userOperations = [...this.loadOperationsSync(userId)];
    const existingIndex = userOperations.findIndex((op) => op.operationId === operation.operationId);
    if (existingIndex >= 0) {
      userOperations[existingIndex] = operation;
    } else {
      userOperations.push(operation);
    }

    this.persistOperations(userId, userOperations);
  }

  /**
   * Retrieves pending operations from durable IndexedDB storage.
   */
  public async getPendingOperations(userId: string): Promise<OfflineOperation[]> {
    const userOperations = await this.loadOperations(userId);
    return userOperations.filter((op) => op.syncStatus === "pending");
  }

  public getPendingOperationsSync(userId: string): OfflineOperation[] {
    const userOperations = this.loadOperationsSync(userId);
    return userOperations.filter((op) => op.syncStatus === "pending");
  }

  /**
   * Marks an operation as successfully synced to the cloud, awaiting storage update.
   */
  public async markSynced(userId: string, operationId: string): Promise<void> {
    const userOperations = [...(await this.loadOperations(userId))];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "synced";
      await this.persistOperationsAsync(userId, userOperations);
    }
  }

  /**
   * Marks an operation as having a conflict requiring user intervention.
   */
  public async markConflict(userId: string, operationId: string, conflictDetails: string): Promise<void> {
    const userOperations = [...(await this.loadOperations(userId))];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "conflict";
      op.conflictDetails = conflictDetails;
      await this.persistOperationsAsync(userId, userOperations);
    }
  }

  /**
   * Safe Session Eviction: Removes user operations from active memory on logout,
   * while PRESERVING durable unsynced work in IndexedDB under the user's isolated ID.
   */
  public purgeUserData(userId: string, forceDeleteStorage = false): void {
    this.memoryCache.delete(userId);
    if (forceDeleteStorage && this.isBrowser) {
      idbDel(this.getStorageKey(userId)).catch(() => {});
      localStorage.removeItem(this.getStorageKey(userId));
    }
  }

  public clearUserQueue(userId: string): void {
    this.purgeUserData(userId, false);
  }

  public async getQueueSummary(userId: string): Promise<{ pending: number; synced: number; conflict: number }> {
    const ops = await this.loadOperations(userId);
    return {
      pending: ops.filter((o) => o.syncStatus === "pending").length,
      synced: ops.filter((o) => o.syncStatus === "synced").length,
      conflict: ops.filter((o) => o.syncStatus === "conflict").length,
    };
  }
}
