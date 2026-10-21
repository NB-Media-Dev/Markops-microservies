import type { Request, Response } from "express";
import { dbPool, dbTasksStore, dbUsersStore, type TaskStoreItem } from "../config/db.js";
import { formatDueDate, computeTaskProgress } from "../middleware/upload.middleware.js";

export async function getDesignerDashboardMetrics(req: Request, res: Response): Promise<Response> {
  const user = (req as any).user;
  const targetUserId = req.query.designerId ? String(req.query.designerId) : (user?.id ? String(user.id) : null);
  const todayStr = new Date().toISOString().split("T")[0];

  let designerTasks: TaskStoreItem[] = [];

  if (dbPool.isConnected()) {
    try {
      let query = `
        SELECT t.*, u.full_name as assignee_full_name, c.full_name as creator_full_name, c.email as creator_email, COALESCE(cr.code, 'BDM') as creator_role
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users c ON t.created_by = c.id
        LEFT JOIN roles cr ON c.role_id = cr.id
      `;
      const params: any[] = [];
      if (targetUserId && targetUserId !== "all") {
        query += " WHERE t.assigned_to = ?";
        params.push(targetUserId);
      }
      query += " ORDER BY t.created_at DESC";

      const [rows] = await dbPool.query(query, params);
      if (Array.isArray(rows)) {
        designerTasks = rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          taskType: row.task_type || "BANNER_DESIGN",
          packageName: row.package_name || "",
          productId: row.product_id || "",
          productName: row.product_name || "",
          description: row.description || "",
          content: row.content || "",
          attachmentUrl: row.attachment_url || "",
          attachmentName: row.attachment_name || "",
          reviewerFeedback: row.reviewer_feedback || "",
          status: row.status,
          priority: row.priority,
          createdBy: row.created_by,
          creatorName: row.creator_full_name || "Manager",
          creatorEmail: row.creator_email || "",
          creatorRole: row.creator_role || "BDM",
          assignedTo: row.assigned_to,
          assigneeName: row.assignee_full_name || "Designer",
          dueDate: formatDueDate(row.due_date),
          progressPercent: computeTaskProgress(row.status, row.progress_percent),
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        }));
      }
    } catch (e: any) {
      console.warn("[Designer Metrics DB Notice]:", e?.message || e);
    }
  }

  // Fallback to in-memory store if DB query returned nothing
  if (designerTasks.length === 0) {
    designerTasks = targetUserId && targetUserId !== "all"
      ? dbTasksStore.filter((t) => String(t.assignedTo) === targetUserId || String(t.assigned_to) === targetUserId)
      : dbTasksStore;
  }

  // Calculate metrics
  const assignedToday = designerTasks.filter(
    (t) => (t.createdAt && t.createdAt.startsWith(todayStr)) || t.status === "ASSIGNED"
  );
  const inProgress = designerTasks.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "ACCEPTED"
  );
  const dueToday = designerTasks.filter((t) => t.dueDate === todayStr);
  const overdue = designerTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== "COMPLETED" && t.status !== "APPROVED"
  );
  const submittedWaiting = designerTasks.filter(
    (t) => t.status === "SUBMITTED" || t.status === "RESUBMITTED" || t.status === "UNDER_REVIEW"
  );
  const revisionRequired = designerTasks.filter(
    (t) => t.status === "REVISION_REQUIRED" || t.status === "REDESIGN_REQUIRED"
  );
  const completed = designerTasks.filter(
    (t) => t.status === "APPROVED" || t.status === "PUBLISHED" || t.status === "COMPLETED"
  );

  const statusDistribution = {
    ASSIGNED: designerTasks.filter((t) => t.status === "ASSIGNED").length,
    IN_PROGRESS: inProgress.length,
    SUBMITTED: submittedWaiting.length,
    REVISION_REQUIRED: revisionRequired.length,
    APPROVED: completed.length
  };

  const priorityDistribution = {
    URGENT: designerTasks.filter((t) => t.priority === "URGENT").length,
    HIGH: designerTasks.filter((t) => t.priority === "HIGH").length,
    MEDIUM: designerTasks.filter((t) => t.priority === "MEDIUM").length,
    LOW: designerTasks.filter((t) => t.priority === "LOW").length
  };

  const packageDistribution: Record<string, number> = {};
  designerTasks.forEach((t) => {
    const pkg = t.packageName || "General";
    packageDistribution[pkg] = (packageDistribution[pkg] || 0) + 1;
  });

  const totalTasks = designerTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;

  return res.json({
    success: true,
    data: {
      assignedToday: assignedToday.length,
      inProgress: inProgress.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      submittedWaiting: submittedWaiting.length,
      revisionRequired: revisionRequired.length,
      completed: completed.length,
      totalTasks,
      completionRate,
      averageTurnaroundHours: 14.5,
      statusDistribution,
      priorityDistribution,
      packageDistribution,
      timestamp: new Date().toISOString()
    }
  });
}

export async function getDesignersDirectory(_req: Request, res: Response): Promise<Response> {
  let designers: any[] = [];

  if (dbPool.isConnected()) {
    try {
      const [rows] = await dbPool.query(`
        SELECT u.id, u.email, u.full_name, u.avatar_url, u.department, u.is_active,
               COUNT(t.id) as total_tasks,
               SUM(CASE WHEN t.status IN ('APPROVED', 'COMPLETED', 'PUBLISHED') THEN 1 ELSE 0 END) as completed_tasks,
               SUM(CASE WHEN t.status IN ('IN_PROGRESS', 'ACCEPTED', 'ASSIGNED') THEN 1 ELSE 0 END) as active_tasks
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN tasks t ON t.assigned_to = u.id
        WHERE r.code = 'DESIGNER' OR u.department LIKE '%Design%'
        GROUP BY u.id
      `);
      if (Array.isArray(rows) && rows.length > 0) {
        designers = rows.map((r: any) => ({
          id: String(r.id),
          email: r.email,
          fullName: r.full_name,
          avatarUrl: r.avatar_url,
          department: r.department,
          isActive: Boolean(r.is_active),
          totalTasks: parseInt(r.total_tasks, 10) || 0,
          completedTasks: parseInt(r.completed_tasks, 10) || 0,
          activeTasks: parseInt(r.active_tasks, 10) || 0,
          workloadScore: Math.min(100, (parseInt(r.active_tasks, 10) || 0) * 20)
        }));
      }
    } catch (e: any) {
      console.warn("[Designers Directory DB Notice]:", e?.message || e);
    }
  }

  if (designers.length === 0) {
    const rawDesigners = dbUsersStore.filter(
      (u) => u.role === "DESIGNER" || (u.department && u.department.includes("Design"))
    );
    designers = rawDesigners.map((u) => {
      const userTasks = dbTasksStore.filter((t) => String(t.assignedTo) === String(u.id));
      const completed = userTasks.filter((t) => t.status === "APPROVED" || t.status === "COMPLETED").length;
      const active = userTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "ASSIGNED").length;
      return {
        id: String(u.id),
        email: u.email,
        fullName: u.fullName,
        avatarUrl: (u as any).avatarUrl,
        department: u.department,
        isActive: u.isActive,
        totalTasks: userTasks.length,
        completedTasks: completed,
        activeTasks: active,
        workloadScore: Math.min(100, active * 25)
      };
    });
  }

  return res.json({
    success: true,
    data: designers
  });
}

