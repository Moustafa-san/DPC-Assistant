import { OfflineOperation, EntityType } from "../repositories/offline-queue";

export type ReconciliationStatus =
  | "applied"
  | "merged"
  | "idempotent_duplicate"
  | "conflict_requires_user_action"
  | "rejected";

export interface ServerEntityState {
  id: string;
  version: number;
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface ReconciliationResult {
  status: ReconciliationStatus;
  entityType: EntityType;
  entityId: string;
  newVersion?: number;
  resolvedData?: Record<string, unknown>;
  conflictReason?: string;
}

export interface ReconciliationContext {
  processedOperationIds: Set<string>;
  serverEntity: ServerEntityState | null; // null if entity doesn't exist on server yet
}

/**
 * Pure domain reconciliation function for offline synchronization (ADR-011).
 * Adheres strictly to:
 * 1. Zero Last-Write-Wins (LWW) on financial operations (invoices and payments).
 * 2. Additive union merge for list items (shotlists, checklists).
 * 3. Optimistic concurrency check with version gating for entity metadata.
 * 4. Idempotency verification to prevent duplicate execution.
 */
export function reconcileOfflineOperation(
  operation: OfflineOperation,
  context: ReconciliationContext
): ReconciliationResult {
  const { operationId, entityType, entityId, action, payload, baseVersion } = operation;
  const { processedOperationIds, serverEntity } = context;

  // 1. Idempotency Check
  if (processedOperationIds.has(operationId)) {
    return {
      status: "idempotent_duplicate",
      entityType,
      entityId,
      resolvedData: serverEntity?.data,
    };
  }

  // 2. Creation on Non-existent Entity
  if (action === "create") {
    if (serverEntity !== null) {
      // Entity already exists with this ID!
      return {
        status: "conflict_requires_user_action",
        entityType,
        entityId,
        conflictReason: "ENTITY_ALREADY_EXISTS_ON_SERVER",
      };
    }
    return {
      status: "applied",
      entityType,
      entityId,
      newVersion: 1,
      resolvedData: payload,
    };
  }

  // If action is update/delete but server entity doesn't exist
  if (!serverEntity) {
    return {
      status: "rejected",
      entityType,
      entityId,
      conflictReason: "ENTITY_NOT_FOUND_ON_SERVER",
    };
  }

  // 3. Financial Invariants: Invoices and Payments
  if (entityType === "invoice" || entityType === "payment") {
    // Financial records cannot be deleted once recorded
    if (action === "delete") {
      return {
        status: "rejected",
        entityType,
        entityId,
        conflictReason: "FINANCIAL_DELETION_PROHIBITED",
      };
    }

    // Version mismatch strictly halts automated overwrite
    if (serverEntity.version !== baseVersion) {
      return {
        status: "conflict_requires_user_action",
        entityType,
        entityId,
        conflictReason: "FINANCIAL_VERSION_MISMATCH_NO_LWW",
      };
    }

    return {
      status: "applied",
      entityType,
      entityId,
      newVersion: serverEntity.version + 1,
      resolvedData: { ...serverEntity.data, ...payload },
    };
  }

  // 4. Additive Merge for Shotlists
  if (entityType === "shotlist" && action === "update") {
    const serverItems = Array.isArray(serverEntity.data.items) ? serverEntity.data.items : [];
    const clientItems = Array.isArray(payload.items) ? payload.items : [];

    // Combine items by unique id, preserving server updates and adding new client shots
    const itemMap = new Map<string, Record<string, unknown>>();

    for (const item of serverItems) {
      if (item && typeof item === "object" && "id" in item) {
        itemMap.set(String((item as Record<string, unknown>).id), item as Record<string, unknown>);
      }
    }

    for (const item of clientItems) {
      if (item && typeof item === "object" && "id" in item) {
        const id = String((item as Record<string, unknown>).id);
        const existing = itemMap.get(id);
        if (!existing) {
          // New offline shot added
          itemMap.set(id, item as Record<string, unknown>);
        } else {
          // Both modified: merge properties
          itemMap.set(id, { ...existing, ...item });
        }
      }
    }

    const mergedItems = Array.from(itemMap.values());
    const mergedData = {
      ...serverEntity.data,
      ...payload,
      items: mergedItems,
    };

    return {
      status: "merged",
      entityType,
      entityId,
      newVersion: serverEntity.version + 1,
      resolvedData: mergedData,
    };
  }

  // 5. Standard Optimistic Concurrency for Projects, Clients, Assets
  if (serverEntity.version === baseVersion) {
    if (action === "delete") {
      return {
        status: "applied",
        entityType,
        entityId,
        newVersion: serverEntity.version + 1,
        resolvedData: undefined,
      };
    }

    return {
      status: "applied",
      entityType,
      entityId,
      newVersion: serverEntity.version + 1,
      resolvedData: { ...serverEntity.data, ...payload },
    };
  }

  // If server has advanced past baseVersion
  return {
    status: "conflict_requires_user_action",
    entityType,
    entityId,
    conflictReason: `CONCURRENT_MODIFICATION: server is at version ${serverEntity.version}, client based on ${baseVersion}`,
  };
}
