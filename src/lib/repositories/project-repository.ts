import { getBrowserSupabaseClient } from "../supabase/client";
import { getSupabaseEnv } from "../supabase/config";
import { OfflineQueueManager, OfflineOperation, EntityType } from "./offline-queue";
import { idbGet, idbSet } from "./indexed-db";

export interface StoredProject {
  id: string;
  ownerId: string;
  clientId?: string;
  title: string;
  projectType: string;
  status: "draft" | "confirmed" | "in_progress" | "completed" | "cancelled";
  currency: string;
  shootDate?: string;
  deliveryDate?: string;
  notes?: string;
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
 * Mapped with 100% fidelity to PostgreSQL schema columns and IndexedDB local store.
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
            clientId: row.client_id || undefined,
            title: row.title || "مشروع جديد",
            projectType: row.project_type || "commercial",
            status: (row.status as StoredProject["status"]) || "draft",
            shootDate: row.shoot_date ? row.shoot_date.split("T")[0] : "",
            deliveryDate: row.delivery_date ? row.delivery_date.split("T")[0] : "",
            notes: row.notes || "",
            currency: row.currency || "EGP",
            version: (row.version as number) || 1,
            updatedAt: row.updated_at || new Date().toISOString(),
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
   * Saves or updates a project with strict column mappings to public.projects.
   */
  public async saveProject(project: StoredProject): Promise<StoredProject> {
    const { isConfigured } = getSupabaseEnv();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : false;

    const updated: StoredProject = {
      ...project,
      updatedAt: new Date().toISOString(),
      version: (project.version || 1) + 1,
    };

    // 1. Write to local IndexedDB storage immediately
    try {
      const key = this.getStorageKey(project.ownerId);
      const existing = (await idbGet<StoredProject[]>(key)) || [];
      const index = existing.findIndex((p) => p.id === project.id);

      if (index >= 0) {
        existing[index] = updated;
      } else {
        existing.unshift(updated);
      }
      await idbSet(key, existing);
    } catch (err) {
      console.warn("[ProjectRepository] IndexedDB save error:", err);
    }

    // 2. Exact SQL Schema Mapping for public.projects
    const dbPayload = {
      id: project.id,
      owner_id: project.ownerId,
      client_id: project.clientId || null,
      title: project.title,
      project_type: project.projectType || "commercial",
      status: project.status || "draft",
      currency: project.currency || "EGP",
      shoot_date: project.shootDate ? new Date(project.shootDate).toISOString() : null,
      delivery_date: project.deliveryDate ? new Date(project.deliveryDate).toISOString() : null,
      notes: project.notes || null,
      updated_at: updated.updatedAt,
    };

    // 3. Cloud Upsert if online and configured
    if (isConfigured && isOnline) {
      try {
        const supabase = getBrowserSupabaseClient();
        const { error } = await supabase.from("projects").upsert(dbPayload);

        if (!error) {
          return updated;
        }
        console.warn("[ProjectRepository] Supabase upsert error, queuing offline operation:", error);
      } catch (err) {
        console.warn("[ProjectRepository] Network error, queuing offline operation:", err);
      }
    }

    // 4. Queue offline operation durably if cloud call failed or offline
    const offlineOp: OfflineOperation = {
      operationId: `op-proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: project.ownerId,
      entityType: "project",
      entityId: project.id,
      action: "update",
      payload: dbPayload,
      baseVersion: project.version,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    await this.queueManager.enqueue(offlineOp);
    return updated;
  }

  /**
   * Flushes and syncs pending offline mutations across all 13 entity types with strict error validation.
   */
  public async syncPendingQueue(userId: string): Promise<{ synced: number; conflicts: number; failed: number }> {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      return { synced: 0, conflicts: 0, failed: 0 };
    }

    const pending = await this.queueManager.getPendingOperations(userId);
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
        if (op.action === "delete") {
          const { error } = await supabase.from(tableName).delete().eq("id", op.entityId).eq("owner_id", userId);
          if (error) {
            console.error(`[ProjectRepository] Sync delete failed on ${tableName}:`, error);
            failed++;
          } else {
            await this.queueManager.markSynced(userId, op.operationId);
            synced++;
          }
        } else {
          // Create or Update: Upsert into Supabase
          const { error } = await supabase.from(tableName).upsert({
            ...op.payload,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error(`[ProjectRepository] Sync upsert failed on ${tableName}:`, error);
            if (error.code === "409" || error.code === "23505") {
              await this.queueManager.markConflict(userId, op.operationId, error.message);
              conflicts++;
            } else {
              failed++;
            }
          } else {
            await this.queueManager.markSynced(userId, op.operationId);
            synced++;
          }
        }
      } catch (err) {
        console.error(`[ProjectRepository] Unexpected sync exception on ${tableName}:`, err);
        failed++;
      }
    }

    return { synced, conflicts, failed };
  }
}

export const defaultProjectRepository = new ProjectRepository();
