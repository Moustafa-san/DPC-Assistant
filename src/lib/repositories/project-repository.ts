import { getBrowserSupabaseClient } from "../supabase/client";
import { getSupabaseEnv } from "../supabase/config";
import { OfflineQueueManager, OfflineOperation } from "./offline-queue";
import { reconcileOfflineOperation } from "../offline/reconciliation";

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

/**
 * Enterprise Repository for Projects and Workflows.
 * Bridges Supabase Cloud PostgreSQL with the durable Offline Queue and local storage.
 */
export class ProjectRepository {
  private queueManager: OfflineQueueManager;

  constructor(queueManager?: OfflineQueueManager) {
    this.queueManager = queueManager ?? new OfflineQueueManager();
  }

  private getLocalStorageKey(userId: string): string {
    return `${LOCAL_PROJECTS_KEY}${userId}`;
  }

  /**
   * Loads all projects for an authenticated user, falling back to durable offline storage.
   */
  public async loadProjects(userId: string): Promise<StoredProject[]> {
    const { isConfigured } = getSupabaseEnv();

    // 1. If Supabase is configured and online, attempt cloud fetch
    if (isConfigured && typeof navigator !== "undefined" && navigator.onLine) {
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

          // Cache locally for offline resilience
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(this.getLocalStorageKey(userId), JSON.stringify(mapped));
          }

          return mapped;
        }
      } catch (err) {
        console.warn("[ProjectRepository] Supabase fetch failed, falling back to local storage:", err);
      }
    }

    // 2. Fallback to durable local storage
    if (typeof localStorage !== "undefined") {
      try {
        const cached = localStorage.getItem(this.getLocalStorageKey(userId));
        if (cached) {
          return JSON.parse(cached) as StoredProject[];
        }
      } catch (err) {
        console.error("[ProjectRepository] Error reading local projects:", err);
      }
    }

    return [];
  }

  /**
   * Saves or updates a project. If offline, enqueues the mutation into the durable offline queue.
   */
  public async saveProject(project: StoredProject): Promise<StoredProject> {
    const { isConfigured } = getSupabaseEnv();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;

    // Update local cache immediately (Optimistic UI)
    if (typeof localStorage !== "undefined") {
      try {
        const key = this.getLocalStorageKey(project.ownerId);
        const existing = (JSON.parse(localStorage.getItem(key) || "[]") as StoredProject[]) || [];
        const index = existing.findIndex((p) => p.id === project.id);
        if (index >= 0) {
          existing[index] = { ...project, updatedAt: new Date().toISOString() };
        } else {
          existing.unshift({ ...project, updatedAt: new Date().toISOString() });
        }
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (err) {
        console.error("[ProjectRepository] Local cache save error:", err);
      }
    }

    // Attempt cloud sync if online and configured
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
        console.warn("[ProjectRepository] Supabase upsert error, enqueuing offline mutation:", error);
      } catch (err) {
        console.warn("[ProjectRepository] Network error during upsert, enqueuing offline:", err);
      }
    }

    // If unconfigured or offline, queue operation durably
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
   * Flushes and syncs pending offline operations when connection is re-established.
   */
  public async syncPendingQueue(userId: string): Promise<{ synced: number; conflicts: number }> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      return { synced: 0, conflicts: 0 };
    }

    const pending = this.queueManager.getPendingOperations(userId);
    let synced = 0;
    let conflicts = 0;

    const supabase = getBrowserSupabaseClient();

    for (const op of pending) {
      try {
        // Fetch server entity to reconcile
        const { data: serverRow } = await supabase
          .from(op.entityType === "project" ? "projects" : "shots")
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
          await supabase
            .from(op.entityType === "project" ? "projects" : "shots")
            .upsert({
              id: op.entityId,
              owner_id: userId,
              ...resolution.resolvedData,
              version: resolution.newVersion,
              updated_at: new Date().toISOString(),
            });

          this.queueManager.markSynced(userId, op.operationId);
          synced++;
        } else if (resolution.status === "conflict_requires_user_action") {
          this.queueManager.markConflict(userId, op.operationId, resolution.conflictReason || "Conflict");
          conflicts++;
        }
      } catch (err) {
        console.error(`[ProjectRepository] Sync error for op ${op.operationId}:`, err);
      }
    }

    return { synced, conflicts };
  }
}
