import { getBrowserSupabaseClient } from "../supabase/client";
import { getSupabaseEnv } from "../supabase/config";
import { OfflineQueueManager, OfflineOperation, EntityType } from "./offline-queue";
import { reconcileOfflineOperation } from "../offline/reconciliation";
import { idbGet, idbSet } from "./indexed-db";

export interface StoredProject {
  id: string;
  ownerId: string;
  title: string;
  clientName: string;
  eventDate: string;
  location: string;
  currency: string;
  version: number;
  updatedAt: string;
  data: Record<string, unknown>;
}

const LOCAL_PROJECTS_KEY = "dpc_assistant_projects_";

const ENTITY_TABLE_MAP: Record<EntityType, string> = {
  project: "projects",
  client: "clients",
  brief: "briefs",
  quote: "quotes",
  quote_item: "quote_items",
  shotlist: "shotlists",
  shot: "shots",
  palette: "palettes",
  invoice: "invoices",
  invoice_item: "invoice_items",
  payment: "payments",
  income_ledger: "income_ledger",
  asset: "assets",
};

/**
 * Enterprise Repository for Projects and Studio Operations.
 * Integrates IndexedDB durable local persistence with Supabase PostgreSQL cloud sync.
 */
export class ProjectRepository {
  private queueManager: OfflineQueueManager;

  constructor(queueManager?: OfflineQueueManager) {
    this.queueManager = queueManager ?? new OfflineQueueManager();
  }

  private getStorageKey(userId: string): string {
    return `${LOCAL_PROJECTS_KEY}${userId}`;
  }

  /**
   * Loads projects for an authenticated user, consulting Supabase cloud first,
   * falling back to durable IndexedDB storage.
   */
  public async loadProjects(userId: string): Promise<StoredProject[]> {
    const { isConfigured } = getSupabaseEnv();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;

    // 1. Fetch from Supabase Cloud if configured and online
    if (isConfigured && isOnline) {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("owner_id", userId)
          .order("updated_at", { ascending: false });

        if (!error && data) {
          const mapped: StoredProject[] = data.map((row) => ({
            id: row.id,
            ownerId: row.owner_id,
            title: row.name,
            clientName: row.client_id || "عميل",
            eventDate: row.shoot_date,
            location: row.location || "",
            currency: row.currency || "EGP",
            version: row.version || 1,
            updatedAt: row.updated_at,
            data: row,
          }));

          // Cache in IndexedDB for resilient offline operations
          await idbSet(this.getStorageKey(userId), mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("[ProjectRepository] Cloud fetch error, reading IndexedDB:", err);
      }
    }

    // 2. Read from persistent IndexedDB
    try {
      const cached = await idbGet<StoredProject[]>(this.getStorageKey(userId));
      if (cached && Array.isArray(cached)) {
        return cached;
      }
    } catch (err) {
      console.error("[ProjectRepository] IndexedDB read error:", err);
    }

    return [];
  }

  /**
   * Saves or updates a project with optimistic IndexedDB write through and cloud synchronization.
   */
  public async saveProject(project: StoredProject): Promise<StoredProject> {
    const { isConfigured } = getSupabaseEnv();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;

    // 1. Write to local IndexedDB storage immediately (Optimistic UI)
    try {
      const key = this.getStorageKey(project.ownerId);
      const existing = (await idbGet<StoredProject[]>(key)) || [];
      const index = existing.findIndex((p) => p.id === project.id);
      const updated: StoredProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        existing[index] = updated;
      } else {
        existing.unshift(updated);
      }
      await idbSet(key, existing);
    } catch (err) {
      console.warn("[ProjectRepository] IndexedDB save error:", err);
    }

    // 2. Cloud Upsert if online and configured
    if (isConfigured && isOnline) {
      try {
        const supabase = getBrowserSupabaseClient();
        const { error } = await supabase.from("projects").upsert({
          id: project.id,
          owner_id: project.ownerId,
          name: project.title,
          shoot_date: project.eventDate,
          location: project.location,
          currency: project.currency,
          version: project.version + 1,
          updated_at: new Date().toISOString(),
        });

        if (!error) {
          return {
            ...project,
            version: project.version + 1,
            updatedAt: new Date().toISOString(),
          };
        }
        console.warn("[ProjectRepository] Supabase upsert error, queuing offline operation:", error);
      } catch (err) {
        console.warn("[ProjectRepository] Network error, queuing offline operation:", err);
      }
    }

    // 3. Queue offline operation durably if cloud call failed or offline
    const offlineOp: OfflineOperation = {
      operationId: `op-proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: project.ownerId,
      entityType: "project",
      entityId: project.id,
      action: "update",
      payload: project.data,
      baseVersion: project.version,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    this.queueManager.enqueue(offlineOp);
    return project;
  }

  /**
   * Flushes and syncs pending offline mutations across all 13 entity types with strict error validation.
   */
  public async syncPendingQueue(userId: string): Promise<{ synced: number; conflicts: number; failed: number }> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      return { synced: 0, conflicts: 0, failed: 0 };
    }

    const pending = this.queueManager.getPendingOperations(userId);
    let synced = 0;
    let conflicts = 0;
    let failed = 0;

    const supabase = getBrowserSupabaseClient();

    for (const op of pending) {
      const tableName = ENTITY_TABLE_MAP[op.entityType];
      if (!tableName) {
        console.error(`[ProjectRepository] Unknown entity type: ${op.entityType}`);
        failed++;
        continue;
      }

      try {
        // Fetch server entity to detect conflicts
        const { data: serverRow } = await supabase
          .from(tableName)
          .select("*")
          .eq("id", op.entityId)
          .single();

        const serverEntity = serverRow
          ? {
              id: serverRow.id,
              version: serverRow.version || 1,
              updatedAt: serverRow.updated_at,
              data: serverRow,
            }
          : null;

        const resolution = reconcileOfflineOperation(op, {
          processedOperationIds: new Set(),
          serverEntity,
        });

        if (resolution.status === "applied" || resolution.status === "merged") {
          // Push reconciled data to Supabase
          const { error: upsertError } = await supabase.from(tableName).upsert({
            id: op.entityId,
            owner_id: userId,
            ...resolution.resolvedData,
            version: resolution.newVersion,
            updated_at: new Date().toISOString(),
          });

          // Check error BEFORE marking synced
          if (upsertError) {
            console.error(`[ProjectRepository] Supabase rejected sync for ${tableName}:${op.entityId}`, upsertError);
            this.queueManager.markConflict(userId, op.operationId, upsertError.message);
            conflicts++;
          } else {
            this.queueManager.markSynced(userId, op.operationId);
            synced++;
          }
        } else if (resolution.status === "conflict_requires_user_action") {
          this.queueManager.markConflict(userId, op.operationId, resolution.conflictReason || "Conflict");
          conflicts++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`[ProjectRepository] Sync network error for op ${op.operationId}:`, err);
        failed++;
      }
    }

    return { synced, conflicts, failed };
  }
}

export const defaultProjectRepository = new ProjectRepository();
