import type { Request, Response } from "express";
import {
  dbPool,
  dbTasksStore,
  type TaskStoreItem,
  type VersionItem,
  type StatusHistoryItem,
  type CommentItem
} from "../config/db.js";
import { emitRealtimeEvent } from "../events/socket.events.js";
import { dispatchNotification } from "../services/notification.service.js";
import {
  saveBase64Attachment,
  formatDueDate,
  computeTaskProgress
} from "../middleware/upload.middleware.js";

export async function findTask(taskId: any): Promise<TaskStoreItem | null> {
  if (taskId === undefined || taskId === null) return null;

  if (dbPool.isConnected()) {
    try {
      const [rows] = await dbPool.query(
        `SELECT t.*, u.full_name as assignee_full_name, c.full_name as creator_full_name, c.email as creator_email, COALESCE(cr.code, 'BDM') as creator_role
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN users c ON t.created_by = c.id
         LEFT JOIN roles cr ON c.role_id = cr.id
         WHERE t.id = ?
         LIMIT 1`,
        [taskId]
      );

      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const safeDueDate = formatDueDate(row.due_date);

        let versions: VersionItem[] = [];
        try {
          const [verRows] = await dbPool.query(
            `SELECT v.*, u.full_name as author_name
             FROM task_versions v
             LEFT JOIN users u ON v.submitted_by = u.id
             WHERE v.task_id = ?
             ORDER BY v.version_number DESC`,
            [taskId]
          );
          if (Array.isArray(verRows)) {
            versions = verRows.map((v: any) => ({
              id: v.id,
              taskId: v.task_id,
              versionNumber: v.version_number,
              submittedBy: v.submitted_by,
              submittedByName: v.author_name || "Designer",
              fileName: v.file_name,
              filePath: v.file_path,
              fileSize: v.file_size,
              mimeType: v.mime_type,
              changelog: v.changelog,
              createdAt: v.created_at ? new Date(v.created_at).toISOString() : new Date().toISOString()
            }));
          }
        } catch {}

        let statusHistory: StatusHistoryItem[] = [];
        try {
          const [histRows] = await dbPool.query(
            `SELECT h.*, u.full_name as actor_name
             FROM task_status_history h
             LEFT JOIN users u ON h.actor_id = u.id
             WHERE h.task_id = ?
             ORDER BY h.created_at DESC`,
            [taskId]
          );
          if (Array.isArray(histRows)) {
            statusHistory = histRows.map((h: any) => ({
              id: h.id,
              taskId: h.task_id,
              actorId: h.actor_id,
              actorName: h.actor_name || "System",
              previousStatus: h.previous_status,
              newStatus: h.new_status,
              remark: h.remark,
              createdAt: h.created_at ? new Date(h.created_at).toISOString() : new Date().toISOString()
            }));
          }
        } catch {}

        let comments: CommentItem[] = [];
        try {
          const [commRows] = await dbPool.query(
            `SELECT c.*, u.full_name as user_name, r.code as user_role
             FROM task_comments c
             LEFT JOIN users u ON c.user_id = u.id
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE c.task_id = ?
             ORDER BY c.created_at ASC`,
            [taskId]
          );
          if (Array.isArray(commRows)) {
            comments = commRows.map((c: any) => ({
              id: c.id,
              taskId: c.task_id,
              userId: c.user_id,
              userName: c.user_name || "User",
              userRole: c.user_role || "ADMINISTRATOR",
              comment: c.comment,
              createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString()
            }));
          }
        } catch {}

        return {
          id: row.id,
          title: row.title || "Untitled Task",
          taskType: row.task_type || "BANNER_DESIGN",
          packageName: row.package_name || "",
          productId: row.product_id || "",
          productName: row.product_name || "",
          description: row.description || "",
          content: row.content || "",
          attachmentUrl: row.attachment_url || "",
          attachmentName: row.attachment_name || "",
          reviewerFeedback: row.reviewer_feedback || "",
          status: row.status || "ASSIGNED",
          priority: row.priority || "MEDIUM",
          createdBy: row.created_by,
          creatorName: row.creator_full_name || "Manager",
          creatorEmail: row.creator_email || "",
          creatorRole: row.creator_role || "BDM",
          assignedTo: row.assigned_to,
          assigneeName: row.assignee_full_name || "Designer",
          dueDate: safeDueDate,
          progressPercent: computeTaskProgress(row.status, row.progress_percent),
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          versions,
          statusHistory,
          comments
        };
      }
    } catch (e: any) {
      console.warn("[findTask DB Notice]:", e?.message || e);
    }
  }

  const targetIdStr = String(taskId).trim();
  const memTask = dbTasksStore.find((t) => String(t.id).trim() === targetIdStr);
  return memTask || null;
}

export async function getTasks(req: Request, res: Response): Promise<Response> {
  const { status, assignedTo, createdBy, view } = req.query;
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

  if (dbPool.isConnected()) {
    try {
      let query = `
        SELECT t.*, u.full_name as assignee_full_name, c.full_name as creator_full_name, c.email as creator_email, COALESCE(cr.code, 'BDM') as creator_role
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users c ON t.created_by = c.id
        LEFT JOIN roles cr ON c.role_id = cr.id
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

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY t.created_at DESC";

      const [rows] = await dbPool.query(query, params);
      if (Array.isArray(rows)) {
        const tasks: TaskStoreItem[] = rows.map((row: any) => ({
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
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          versions: [],
          statusHistory: [],
          comments: []
        }));
        return res.json(tasks);
      }
    } catch (e: any) {
      console.warn("[getTasks DB Notice]:", e?.message || e);
    }
  }

  // Fallback to in-memory store
  let filtered = [...dbTasksStore];
  if (status && status !== "ALL") {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (targetAssignedTo) {
    filtered = filtered.filter((t) => String(t.assignedTo) === String(targetAssignedTo));
  }
  if (targetCreatedBy) {
    filtered = filtered.filter((t) => String(t.createdBy) === String(targetCreatedBy));
  }
  return res.json(filtered);
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
    description,
    taskType = "BANNER_DESIGN",
    packageName = "",
    productId = "",
    productName = "",
    content = "",
    attachmentUrl = "",
    attachmentName = "",
    priority = "MEDIUM",
    assignedTo = null,
    dueDate = null
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const user = (req as any).user;
  const creatorId = user?.id || 1;
  const creatorName = user?.fullName || "Manager";
  const creatorRole = user?.role || "BDM";
  const savedAttachmentUrl = saveBase64Attachment(attachmentUrl, attachmentName, "briefs") || "";
  const safeDueDate = formatDueDate(dueDate);

  const newTask: TaskStoreItem = {
    id: Date.now(),
    title,
    taskType,
    packageName,
    productId,
    productName: productName || packageName,
    description: description || "",
    content: content || "",
    attachmentUrl: savedAttachmentUrl,
    attachmentName,
    reviewerFeedback: "",
    status: "ASSIGNED",
    priority,
    createdBy: creatorId,
    creatorName,
    creatorRole,
    creatorEmail: user?.email || "",
    assignedTo: assignedTo || 2,
    assigneeName: "Creative Designer",
    dueDate: safeDueDate,
    progressPercent: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [],
    statusHistory: [
      {
        id: Date.now() + 1,
        taskId: 0,
        actorId: creatorId,
        actorName: creatorName,
        previousStatus: "DRAFT",
        newStatus: "ASSIGNED",
        remark: "Task created and assigned to Designer.",
        createdAt: new Date().toISOString()
      }
    ],
    comments: []
  };

  if (dbPool.isConnected()) {
    try {
      const [insertRes] = await dbPool.query(
        `INSERT INTO tasks (title, task_type, package_name, product_id, product_name, description, content, attachment_url, attachment_name, status, priority, created_by, assigned_to, due_date, progress_percent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          title,
          taskType,
          packageName,
          productId,
          productName || packageName,
          description || "",
          content || "",
          savedAttachmentUrl,
          attachmentName,
          "ASSIGNED",
          priority,
          creatorId,
          assignedTo || 2,
          safeDueDate || null,
          10
        ]
      );
      if (insertRes && insertRes.insertId) {
        newTask.id = insertRes.insertId;
        if (newTask.statusHistory && newTask.statusHistory[0]) {
          newTask.statusHistory[0].taskId = insertRes.insertId;
        }
        try {
          await dbPool.query(
            `INSERT INTO task_status_history (task_id, actor_id, previous_status, new_status, remark, created_at)
             VALUES (?, ?, 'DRAFT', 'ASSIGNED', 'Task created and assigned', NOW())`,
            [insertRes.insertId, creatorId]
          );
        } catch {}
      }
    } catch (e: any) {
      console.warn("[createTask DB Notice]:", e?.message || e);
    }
  }

  dbTasksStore.unshift(newTask);

  // Dispatch realtime event & notification
  emitRealtimeEvent("task:created", newTask);
  emitRealtimeEvent("task:assigned", newTask);

  await dispatchNotification({
    userId: newTask.assignedTo,
    title: "New Design Task Assigned",
    message: `You have been assigned "${newTask.title}" (${newTask.priority} Priority). Due: ${newTask.dueDate || "Flexible"}.`,
    type: "INFO",
    targetRoute: `/designer-tasks/${newTask.id}`
  });

  return res.status(201).json(newTask);
}

export async function deleteTask(req: Request, res: Response): Promise<Response> {
  const taskId = req.params.id;
  if (dbPool.isConnected()) {
    try {
      await dbPool.query("DELETE FROM tasks WHERE id = ?", [taskId]);
    } catch (e: any) {
      console.warn("[deleteTask DB Notice]:", e?.message || e);
    }
  }

  const idx = dbTasksStore.findIndex((t) => String(t.id) === String(taskId));
  if (idx !== -1) {
    dbTasksStore.splice(idx, 1);
  }

  emitRealtimeEvent("task:deleted", { taskId });
  return res.json({ success: true, message: `Task #${taskId} deleted successfully` });
}

// State Transition Handlers
export async function handleStatusTransition(req: Request, res: Response): Promise<Response> {
  const taskId = req.params.id;
  const { status, remark, reviewerFeedback, notes } = req.body;
  const user = (req as any).user;
  const actorId = user?.id || 1;
  const actorName = user?.fullName || "User";

  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const previousStatus = task.status;
  const newStatus = (status || previousStatus).toUpperCase();
  const progressPercent = computeTaskProgress(newStatus);
  const updatedFeedback = reviewerFeedback !== undefined ? reviewerFeedback : (task.reviewerFeedback || "");

  if (dbPool.isConnected()) {
    try {
      await dbPool.query(
        `UPDATE tasks
         SET status = ?, progress_percent = ?, reviewer_feedback = ?, updated_at = NOW()
         WHERE id = ?`,
        [newStatus, progressPercent, updatedFeedback, taskId]
      );
      await dbPool.query(
        `INSERT INTO task_status_history (task_id, actor_id, previous_status, new_status, remark, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [taskId, actorId, previousStatus, newStatus, remark || notes || `Transitioned to ${newStatus}`]
      );
    } catch (e: any) {
      console.warn("[handleStatusTransition DB Notice]:", e?.message || e);
    }
  }

  // Update in-memory task
  const mem = dbTasksStore.find((t) => String(t.id) === String(taskId));
  if (mem) {
    mem.status = newStatus;
    mem.progressPercent = progressPercent;
    if (reviewerFeedback !== undefined) mem.reviewerFeedback = reviewerFeedback;
    mem.updatedAt = new Date().toISOString();
    if (!mem.statusHistory) mem.statusHistory = [];
    mem.statusHistory.unshift({
      id: Date.now(),
      taskId: Number(taskId),
      actorId,
      actorName,
      previousStatus,
      newStatus,
      remark: remark || `Transitioned to ${newStatus}`,
      createdAt: new Date().toISOString()
    });
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
      userId: updatedTask.assignedTo,
      title: "Design Approved!",
      message: `Congratulations! Your design for "${updatedTask.title}" has been approved.`,
      type: "SUCCESS",
      targetRoute: `/designer-tasks/${updatedTask.id}`
    });
  } else if (newStatus === "REVISION_REQUIRED" || newStatus === "REDESIGN_REQUIRED") {
    await dispatchNotification({
      userId: updatedTask.assignedTo,
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

