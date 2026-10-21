import { dbPool } from "../config/db.js";

export interface AuditLogOptions {
  userId: number | string;
  action: string;
  entityType?: string;
  entityId: number | string;
  details?: {
    previousStatus?: string;
    newStatus?: string;
    remark?: string;
    [key: string]: any;
  };
}

export async function recordAuditLog({
  userId,
  action,
  entityType = "TASK",
  entityId,
  details
}: AuditLogOptions): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[Designer Audit Log] [${timestamp}] User ${userId} performed ${action} on ${entityType} #${entityId}`);

  if (dbPool.isConnected()) {
    try {
      await dbPool.query(
        `INSERT INTO task_status_history (task_id, actor_id, previous_status, new_status, remark, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [entityId, userId, details?.previousStatus || null, details?.newStatus || action, details?.remark || null]
      );
    } catch (e: any) {
      console.warn("[Audit DB Notice]:", e?.message || e);
    }
  }
}

