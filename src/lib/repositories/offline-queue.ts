import { idbSet, idbDel } from "./indexed-db";

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
 * Backed by persistent browser storage (IndexedDB with LocalStorage fallback).
 * Adheres strictly to:
 * 1. Account isolation (operations are segregated per userId).
 * 2. No Data Loss on Logout: pending operations remain safely locked in storage under the user's ID
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

  private loadOperationsSync(userId: string): OfflineOperation[] {
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

  private persistOperations(userId: string, ops: OfflineOperation[]): void {
    this.memoryCache.set(userId, ops);
    const key = this.getStorageKey(userId);

    // Write through to IndexedDB and localStorage
    if (this.isBrowser) {
      idbSet(key, ops).catch((err) => {
        console.warn("[OfflineQueue] IndexedDB persist error:", err);
      });
      try {
        localStorage.setItem(key, JSON.stringify(ops));
      } catch (err) {
        console.warn("[OfflineQueue] LocalStorage fallback write failed:", err);
      }
    }
  }

  /**
   * Enqueues an offline mutation for a specific authenticated user and persists it durably in IndexedDB.
   */
  public enqueue(operation: OfflineOperation): void {
    const { userId } = operation;
    if (!userId) {
      throw new Error("لا يمكن حفظ عملية دون اتصال بدون معرف مستخدم مصادق عليه");
    }

    const userOperations = [...this.loadOperationsSync(userId)];
    
    // Check idempotency: do not re-enqueue existing operationId
    const existingIndex = userOperations.findIndex((op) => op.operationId === operation.operationId);
    if (existingIndex >= 0) {
      userOperations[existingIndex] = operation;
    } else {
      userOperations.push(operation);
    }

    this.persistOperations(userId, userOperations);
  }

  /**
   * Retrieves pending operations strictly for the given user from durable storage.
   */
  public getPendingOperations(userId: string): OfflineOperation[] {
    const userOperations = this.loadOperationsSync(userId);
    return userOperations.filter((op) => op.syncStatus === "pending");
  }

  /**
   * Marks an operation as successfully synced to the cloud.
   */
  public markSynced(userId: string, operationId: string): void {
    const userOperations = [...this.loadOperationsSync(userId)];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "synced";
      this.persistOperations(userId, userOperations);
    }
  }

  /**
   * Marks an operation as having a conflict requiring user intervention.
   */
  public markConflict(userId: string, operationId: string, conflictDetails: string): void {
    const userOperations = [...this.loadOperationsSync(userId)];
    const op = userOperations.find((o) => o.operationId === operationId);
    if (op) {
      op.syncStatus = "conflict";
      op.conflictDetails = conflictDetails;
      this.persistOperations(userId, userOperations);
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

  public getQueueSummary(userId: string): { pending: number; synced: number; conflict: number } {
    const ops = this.loadOperationsSync(userId);
    return {
      pending: ops.filter((o) => o.syncStatus === "pending").length,
      synced: ops.filter((o) => o.syncStatus === "synced").length,
      conflict: ops.filter((o) => o.syncStatus === "conflict").length,
    };
  }
}
