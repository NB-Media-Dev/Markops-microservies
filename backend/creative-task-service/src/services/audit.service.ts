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
    durationSeconds?: number;
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

  if (dbPool.isConnected() && entityType === "TASK") {
    try {
      const taskId = parseInt(String(entityId), 10);
      const actorId = parseInt(String(userId), 10);
      await dbPool.query(
        `INSERT INTO task_activities (task_id, previous_status, new_status, changed_by, comment, duration_seconds, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          taskId,
          details?.previousStatus || null,
          details?.newStatus || action,
          actorId,
          details?.remark || `Action: ${action}`,
          details?.durationSeconds || null
        ]
      );
    } catch (e: any) {
      console.warn("[Audit DB Notice]:", e?.message || e);
    }
  }
}
