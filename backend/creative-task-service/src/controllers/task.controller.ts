import type { Request, Response } from "express";
import {
  dbPool,
  type TaskItem,
  type DeliverableItem,
  type ActivityItem
} from "../config/db.js";
import { emitRealtimeEvent } from "../events/socket.events.js";
import { dispatchNotification } from "../services/notification.service.js";
import {
  saveBase64Attachment,
  formatDueDate,
  computeTaskProgress
} from "../middleware/upload.middleware.js";

function normalizeTaskType(type?: string): "BANNER" | "POSTER" | "VIDEO" {
  const upper = String(type || "").toUpperCase().trim();
  if (upper.includes("VIDEO")) return "VIDEO";
  if (upper.includes("POST")) return "POSTER";
  return "BANNER";
}

export async function findTask(taskId: any): Promise<TaskItem | null> {
  const numericId = parseInt(String(taskId), 10);
  if (isNaN(numericId)) return null;

  try {
    const [rows]: any = await dbPool.query(
      `SELECT t.*, p.name as resolved_product_name, pkg.name as resolved_package_name,
              u.name as resolved_assignee_name,
              c.name as resolved_creator_name
       FROM tasks t
       LEFT JOIN ourproducts p ON t.product_id = p.id
       LEFT JOIN product_packages pkg ON t.package_id = pkg.id
       LEFT JOIN auth_db.User u ON t.assigned_to = u.id
       LEFT JOIN auth_db.User c ON t.created_by = c.id
       WHERE t.id = ?
       LIMIT 1`,
      [numericId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const row: any = rows[0];

      let deliverables: DeliverableItem[] = [];
      try {
        const [dRows]: any = await dbPool.query(
          `SELECT id, task_id as taskId, user_id as userId, asset_type as assetType, version_number as versionNumber, file_name as fileName, file_path as filePath, storage_key as storageKey, file_size as fileSize, mime_type as mimeType, changelog, created_at as createdAt
           FROM task_deliverables
           WHERE task_id = ?
           ORDER BY version_number DESC, id DESC`,
          [numericId]
        );
        if (Array.isArray(dRows)) {
          deliverables = dRows.map((d: any) => ({
            ...d,
            submittedBy: d.userId,
            createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString()
          }));
        }
      } catch (e: any) {
        console.warn("[findTask deliverables Warning]:", e?.message || e);
      }

      let activities: ActivityItem[] = [];
      try {
        const [aRows]: any = await dbPool.query(
          `SELECT id, task_id as taskId, previous_status as previousStatus, new_status as newStatus, changed_by as changedBy, comment, duration_seconds as durationSeconds, created_at as createdAt
           FROM task_activities
           WHERE task_id = ?
           ORDER BY created_at DESC`,
          [numericId]
        );
        if (Array.isArray(aRows)) {
          activities = aRows.map((a: any) => ({
            ...a,
            actorId: a.changedBy,
            userId: a.changedBy,
            remark: a.comment,
            createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString()
          }));
        }
      } catch (e: any) {
        console.warn("[findTask activities Warning]:", e?.message || e);
      }
    }
  } catch (e: any) {
    console.error("[findTask DB Error]:", e?.message || e);
  }

  return null;
}

export async function getTasks(req: Request, res: Response): Promise<Response> {
  const { status, assignedTo, createdBy, view, productId, packageId, campaignId } = req.query;
  const user = (req as any).user;
  const currentUserId = user?.id ? String(user.id) : null;
  const currentUserRole = user?.role;

  let targetCreatedBy = createdBy ? String(createdBy) : null;
  let targetAssignedTo = assignedTo ? String(assignedTo) : null;

  if (view === "my") {
    if (currentUserRole === "DESIGNER") {
      targetAssignedTo = assignedTo ? String(assignedTo) : currentUserId;
    } else {
      targetCreatedBy = createdBy ? String(createdBy) : currentUserId;
    }
  }

  try {
    let query = `
      SELECT t.*, p.name as resolved_product_name, pkg.name as resolved_package_name,
             u.name as resolved_assignee_name,
             c.name as resolved_creator_name
      FROM tasks t
      LEFT JOIN ourproducts p ON t.product_id = p.id
      LEFT JOIN product_packages pkg ON t.package_id = pkg.id
      LEFT JOIN auth_db.User u ON t.assigned_to = u.id
      LEFT JOIN auth_db.User c ON t.created_by = c.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== "ALL") {
      conditions.push("t.status = ?");
      params.push(status);
    }
    if (targetAssignedTo) {
      conditions.push("t.assigned_to = ?");
      params.push(targetAssignedTo);
    }
    if (targetCreatedBy) {
      conditions.push("t.created_by = ?");
      params.push(targetCreatedBy);
    }
    if (productId) {
      conditions.push("t.product_id = ?");
      params.push(productId);
    }
    if (packageId) {
      conditions.push("t.package_id = ?");
      params.push(packageId);
    }
    if (campaignId) {
      conditions.push("t.campaign_id = ?");
      params.push(campaignId);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY t.created_at DESC";

    const [rows]: any = await dbPool.query(query, params);
    if (Array.isArray(rows)) {
      const tasks: TaskItem[] = rows.map((row: any) => ({
        id: row.id,
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
        creatorName: row.resolved_creator_name ,
        assignedTo: row.assigned_to,
        assigneeName: row.resolved_assignee_name ,
        dueDate: formatDueDate(row.due_date),
        progressPercent: computeTaskProgress(row.status, row.progress_percent),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
        deliverables: [],
        activities: [],
        versions: [],
        comments: [],
        statusHistory: []
      }));
      return res.json(tasks);
    }
    return res.json([]);
  } catch (e: any) {
    console.error("[getTasks DB Error]:", e?.message || e);
    return res.status(500).json({ error: "Failed to fetch tasks" });
  }
}

export async function getMyTasks(req: Request, res: Response): Promise<Response> {
  req.query.view = "my";
  return getTasks(req, res);
}

export async function getTaskById(req: Request, res: Response): Promise<Response> {
  const task = await findTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  return res.json(task);
}

export async function createTask(req: Request, res: Response): Promise<Response> {
  const {
    title,
    taskType,
    task_type,
    packageId,
    package_id,
    packageName,
    package_name,
    productId,
    product_id,
    productName,
    product_name,
    description,
    attachmentUrl,
    attachment_url,
    attachmentName,
    attachment_name,
    priority = "MEDIUM",
    assignedTo,
    assigned_to,
    dueDate,
    due_date
  } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const user = (req as any).user;
  const creatorId = parseInt(String(user?.id || 1), 10);
  const normalizedType = normalizeTaskType(taskType || task_type);
  let targetPackageId = packageId || package_id || null;
  let targetProductId = productId || product_id || null;
  let targetProductName = productName || product_name || null;
  const targetPkgName = packageName || package_name || "";

  if (!targetPackageId && targetPkgName) {
    try {
      const [pkgRows]: any = await dbPool.query(
        "SELECT id, product_id, name FROM product_packages WHERE LOWER(name) = LOWER(?) OR id = ? LIMIT 1",
        [targetPkgName.trim(), targetPkgName.trim()]
      );
      if (Array.isArray(pkgRows) && pkgRows.length > 0) {
        targetPackageId = pkgRows[0].id;
        if (!targetProductId) targetProductId = pkgRows[0].product_id;
      }
    } catch (e: any) {
      console.warn("[createTask package resolution]:", e?.message || e);
    }
  }

  if (targetProductId && !targetProductName) {
    try {
      const [prodRows]: any = await dbPool.query(
        "SELECT name FROM ourproducts WHERE id = ? LIMIT 1",
        [targetProductId]
      );
      if (Array.isArray(prodRows) && prodRows.length > 0) {
        targetProductName = prodRows[0].name;
      }
    } catch {}
  }
  if (!targetProductName) targetProductName = targetPkgName || null;
  const targetAssignedTo = assignedTo || assigned_to ? parseInt(String(assignedTo || assigned_to), 10) : 2;

  const rawAttachmentUrl = attachmentUrl || attachment_url || "";
  const rawAttachmentName = attachmentName || attachment_name || "";
  const savedAttachmentUrl = saveBase64Attachment(rawAttachmentUrl, rawAttachmentName, "briefs") || "";
  const safeDueDate = formatDueDate(dueDate || due_date);

  let taskId = Date.now();

  try {
    // 1. Insert Task into tasks table
    const [insertRes]: any = await dbPool.query(
      `INSERT INTO tasks ( title, task_type, package_id, product_id, product_name, description,attachment_url, attachment_name, status, priority, created_by, assigned_to, due_date, progress_percent, created_at, updated_at)
       VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', ?, ?, ?, ?, 10, NOW(), NOW())`,
      [
        title.trim(),
        normalizedType,
        targetPackageId,
        targetProductId,
        targetProductName,
        description || "",
        savedAttachmentUrl,
        rawAttachmentName,
        String(priority).toUpperCase(),
        creatorId,
        targetAssignedTo,
        safeDueDate || null
      ]
    );

    if (insertRes && insertRes.insertId) {
      taskId = insertRes.insertId;

      // 2. Insert initial entry into task_activities
      try {
        await dbPool.query(
          `INSERT INTO task_activities (task_id, previous_status, new_status, changed_by, comment, created_at)
           VALUES (?, 'DRAFT', 'ASSIGNED', ?, 'Task created and assigned to Designer.', NOW())`,
          [taskId, creatorId]
        );
      } catch (e: any) {
        console.warn("[createTask activity Warning]:", e?.message || e);
      }

      // 3. If brief attachment uploaded, insert deliverable
      if (savedAttachmentUrl) {
        try {
          await dbPool.query(
            `INSERT INTO task_deliverables (task_id, user_id, asset_type, version_number, file_name, file_path, file_size, mime_type, changelog, created_at)
             VALUES (?, ?, 'BRIEF_ATTACHMENT', 1, ?, ?, 0, 'application/pdf', 'Initial Brief Attachment', NOW())`,
            [taskId, creatorId, rawAttachmentName || "brief.pdf", savedAttachmentUrl]
          );
        } catch (e: any) {
          console.warn("[createTask deliverable Warning]:", e?.message || e);
        }
      }
    }
  } catch (e: any) {
    console.error("[createTask DB Error]:", e?.message || e);
    return res.status(500).json({ error: "Failed to create task in database" });
  }

  const createdTask = await findTask(taskId);
  const responseData = createdTask || {
    id: taskId,
    title: title.trim(),
    taskType: normalizedType,
    packageId: targetPackageId,
    packageName: packageName || package_name || "",
    productId: targetProductId,
    productName: targetProductName,
    description: description || "",
    attachmentUrl: savedAttachmentUrl,
    attachmentName: rawAttachmentName,
    reviewerFeedback: "",
    status: "ASSIGNED",
    priority: String(priority).toUpperCase(),
    createdBy: creatorId,
    assignedTo: targetAssignedTo,
    dueDate: safeDueDate,
    progressPercent: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Dispatch realtime event to central realtime-service
  emitRealtimeEvent("task:created", responseData);
  emitRealtimeEvent("task:assigned", responseData);

  await dispatchNotification({
    userId: targetAssignedTo || 2,
    title: "New Design Task Assigned",
    message: `You have been assigned "${title.trim()}" (${String(priority).toUpperCase()} Priority). Due: ${safeDueDate || "Flexible"}.`,
    type: "INFO",
    targetRoute: `/designer-tasks/${taskId}`
  });

  return res.status(201).json(responseData);
}

export async function deleteTask(req: Request, res: Response): Promise<Response> {
  const taskId = parseInt(String(req.params.id), 10);
  try {
    await dbPool.query("DELETE FROM tasks WHERE id = ?", [taskId]);
  } catch (e: any) {
    console.error("[deleteTask DB Error]:", e?.message || e);
    return res.status(500).json({ error: "Failed to delete task from database" });
  }

  emitRealtimeEvent("task:deleted", { taskId });
  return res.json({ success: true, message: `Task #${taskId} deleted successfully` });
}

// State Transition Handlers (Records into task_activities table)
export async function handleStatusTransition(req: Request, res: Response): Promise<Response> {
  const taskId = parseInt(String(req.params.id), 10);
  const { status, remark, reviewerFeedback, reviewer_feedback, notes, durationSeconds, duration_seconds } = req.body;
  const user = (req as any).user;
  const actorId = parseInt(String(user?.id || 1), 10);

  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const previousStatus = task.status;
  const newStatus = (status || previousStatus).toUpperCase();
  const progressPercent = computeTaskProgress(newStatus);
  const updatedFeedback = reviewerFeedback !== undefined ? reviewerFeedback : (reviewer_feedback !== undefined ? reviewer_feedback : (task.reviewerFeedback || ""));
  const duration = durationSeconds || duration_seconds ? parseInt(String(durationSeconds || duration_seconds), 10) : null;
  const commentText = remark || notes || `Transitioned from ${previousStatus} to ${newStatus}`;

  try {
    // 1. Update tasks table
    await dbPool.query(
      `UPDATE tasks
       SET status = ?, progress_percent = ?, reviewer_feedback = ?, updated_at = NOW()
       WHERE id = ?`,
      [newStatus, progressPercent, updatedFeedback, taskId]
    );

    // 2. Insert into task_activities table
    await dbPool.query(
      `INSERT INTO task_activities (task_id, previous_status, new_status, changed_by, comment, duration_seconds, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [taskId, previousStatus, newStatus, actorId, commentText, duration]
    );
  } catch (e: any) {
    console.error("[handleStatusTransition DB Error]:", e?.message || e);
    return res.status(500).json({ error: "Failed to update task status in database" });
  }

  const updatedTask = await findTask(taskId);
  if (!updatedTask) {
    return res.status(404).json({ error: "Task not found after update" });
  }

  emitRealtimeEvent("task:status_changed", updatedTask);
  emitRealtimeEvent("task:updated", updatedTask);

  // Send contextual notification
  if (newStatus === "SUBMITTED") {
    await dispatchNotification({
      userId: updatedTask.createdBy,
      title: "Design Submitted for Review",
      message: `"${updatedTask.title}" has been submitted by Designer. Ready for approval.`,
      type: "INFO",
      targetRoute: `/designer-tasks/${updatedTask.id}`
    });
  } else if (newStatus === "APPROVED") {
    await dispatchNotification({
      userId: updatedTask.assignedTo || 2,
      title: "Design Approved!",
      message: `Congratulations! Your design for "${updatedTask.title}" has been approved.`,
      type: "SUCCESS",
      targetRoute: `/designer-tasks/${updatedTask.id}`
    });
  } else if (newStatus === "REVISION_REQUIRED" || newStatus === "REDESIGN_REQUIRED") {
    await dispatchNotification({
      userId: updatedTask.assignedTo || 2,
      title: "Redesign / Revision Requested",
      message: `Feedback received on "${updatedTask.title}": ${updatedFeedback || "Review notes provided."}`,
      type: "WARNING",
      targetRoute: `/designer-tasks/${updatedTask.id}`
    });
  }

  return res.json({ success: true, task: updatedTask });
}

// Convenience workflow actions
export async function startTask(req: Request, res: Response): Promise<Response> {
  req.body.status = "IN_PROGRESS";
  req.body.remark = req.body.remark || "Designer started working on this task.";
  return handleStatusTransition(req, res);
}

export async function submitTask(req: Request, res: Response): Promise<Response> {
  req.body.status = "SUBMITTED";
  req.body.remark = req.body.remark || "Designer submitted design for review.";
  return handleStatusTransition(req, res);
}

export async function approveTask(req: Request, res: Response): Promise<Response> {
  req.body.status = "APPROVED";
  req.body.remark = req.body.remark || "Reviewer approved design creative.";
  return handleStatusTransition(req, res);
}

export async function redesignTask(req: Request, res: Response): Promise<Response> {
  req.body.status = "REVISION_REQUIRED";
  req.body.remark = req.body.feedback || req.body.remark || "Reviewer requested design revisions.";
  req.body.reviewerFeedback = req.body.feedback || req.body.reviewerFeedback || "";
  return handleStatusTransition(req, res);
}

export async function startRedesignTask(req: Request, res: Response): Promise<Response> {
  req.body.status = "IN_PROGRESS";
  req.body.remark = req.body.remark || "Designer started working on requested redesign.";
  return handleStatusTransition(req, res);
}
