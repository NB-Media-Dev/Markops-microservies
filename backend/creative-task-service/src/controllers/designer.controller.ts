import type { Request, Response } from "express";
import { dbPool, type TaskItem } from "../config/db.js";
import { formatDueDate, computeTaskProgress } from "../middleware/upload.middleware.js";

export async function getDesignerDashboardMetrics(req: Request, res: Response): Promise<Response> {
  const user = (req as any).user;
  const targetUserId = req.query.designerId ? String(req.query.designerId) : (user?.id ? String(user.id) : null);
  const todayStr = new Date().toISOString().split("T")[0];

  let designerTasks: TaskItem[] = [];

  try {
    let query = `
      SELECT t.*, p.name as resolved_product_name, pkg.name as resolved_package_name
      FROM tasks t
      LEFT JOIN ourproducts p ON t.product_id = p.id
      LEFT JOIN product_packages pkg ON t.package_id = pkg.id
    `;
    const params: any[] = [];
    if (targetUserId && targetUserId !== "all") {
      query += " WHERE t.assigned_to = ?";
      params.push(targetUserId);
    }
    query += " ORDER BY t.created_at DESC";

    const [rows]: any = await dbPool.query(query, params);
    if (Array.isArray(rows)) {
      designerTasks = rows.map((row: any) => ({
        id: row.id,
        campaignId: row.campaign_id,
        title: row.title,
        taskType: row.task_type || "BANNER",
        packageId: row.package_id || null,
        packageName: row.resolved_package_name || row.package_id || "",
        productId: row.product_id || null,
        productName: row.product_name || row.resolved_product_name || "",
        description: row.description || "",
        attachmentUrl: row.attachment_url || "",
        attachmentName: row.attachment_name || "",
        reviewerFeedback: row.reviewer_feedback || "",
        status: row.status,
        priority: row.priority,
        createdBy: row.created_by,
        assignedTo: row.assigned_to,
        dueDate: formatDueDate(row.due_date),
        progressPercent: computeTaskProgress(row.status, row.progress_percent),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      }));
    }
  } catch (e: any) {
    console.error("[Designer Metrics DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch dashboard metrics" });
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
  const designerMap = new Map<string, any>();

  try {
    // 1. Fetch real registered designers from auth_db
    try {
      const [userRows]: any = await dbPool.query(`
        SELECT u.id, u.name, u.email, u.department, u.avatar_image, u.isActive, r.name as roleName
        FROM auth_db.User u
        LEFT JOIN auth_db.Role r ON u.roleId = r.id
        WHERE UPPER(r.name) = 'DESIGNER' OR UPPER(u.roleId) LIKE '%DESIGN%' OR LOWER(u.roleId) = 'designer'
      `);
      if (Array.isArray(userRows)) {
        for (const u of userRows) {
          designerMap.set(String(u.id), {
            id: String(u.id),
            fullName: u.name,
            name: u.name,
            email: u.email,
            role: "DESIGNER",
            department: u.department || "Creative Design",
            avatarUrl: u.avatar_image || "",
            isActive: Boolean(u.isActive ?? true),
            totalTasks: 0,
            completedTasks: 0,
            activeTasks: 0,
            workloadScore: 0
          });
        }
      }
    } catch (authErr: any) {
      console.warn("[Designers Directory] Could not query auth_db.User directly:", authErr?.message);
    }

    // 2. Fetch task aggregates from tasks table
    const [taskRows]: any = await dbPool.query(`
      SELECT t.assigned_to as id,
             COUNT(t.id) as total_tasks,
             SUM(CASE WHEN t.status IN ('APPROVED', 'COMPLETED', 'PUBLISHED') THEN 1 ELSE 0 END) as completed_tasks,
             SUM(CASE WHEN t.status IN ('IN_PROGRESS', 'ACCEPTED', 'ASSIGNED') THEN 1 ELSE 0 END) as active_tasks
      FROM tasks t
      WHERE t.assigned_to IS NOT NULL
      GROUP BY t.assigned_to
    `);

    if (Array.isArray(taskRows)) {
      for (const r of taskRows) {
        const idStr = String(r.id);
        const total = parseInt(r.total_tasks, 10) || 0;
        const completed = parseInt(r.completed_tasks, 10) || 0;
        const active = parseInt(r.active_tasks, 10) || 0;

        if (designerMap.has(idStr)) {
          const d = designerMap.get(idStr);
          d.totalTasks = total;
          d.completedTasks = completed;
          d.activeTasks = active;
          d.workloadScore = Math.min(100, active * 20);
        } else {
          designerMap.set(idStr, {
            id: idStr,
            fullName: `Designer #${idStr}`,
            name: `Designer #${idStr}`,
            email: `designer.${idStr}@markops.io`,
            role: "DESIGNER",
            department: "Creative Design Studio",
            avatarUrl: "",
            isActive: true,
            totalTasks: total,
            completedTasks: completed,
            activeTasks: active,
            workloadScore: Math.min(100, active * 20)
          });
        }
      }
    }
  } catch (e: any) {
    console.error("[Designers Directory DB Error]:", e?.message || e);
    return res.status(500).json({ success: false, error: "Failed to fetch designers directory" });
  }

  return res.json({
    success: true,
    data: Array.from(designerMap.values())
  });
}
