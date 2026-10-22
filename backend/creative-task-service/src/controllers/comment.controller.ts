import type { Request, Response } from "express";
import { dbPool, type ActivityItem } from "../config/db.js";
import { emitRealtimeEvent } from "../events/socket.events.js";
import { dispatchNotification } from "../services/notification.service.js";
import { findTask } from "./task.controller.js";

export async function addTaskComment(req: Request, res: Response): Promise<Response> {
  const rawTaskId = req.params.id || req.params.taskId || req.body.taskId || req.body.task_id;
  const taskId = parseInt(String(rawTaskId), 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "taskId is required" });
  }
  const { comment, message } = req.body;
  const commentText = comment || message;

  if (!commentText || typeof commentText !== "string" || !commentText.trim()) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const user = (req as any).user;
  const userId = parseInt(String(user?.id || 1), 10);
  const userName = user?.fullName || "User";
  const userRole = user?.role || "ADMINISTRATOR";

  let activityId = Date.now();

  try {
    const [cRes]: any = await dbPool.query(
      `INSERT INTO task_activities (task_id, previous_status, new_status, changed_by, comment, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [taskId, task.status, task.status, userId, commentText.trim()]
    );
    if (cRes && cRes.insertId) {
      activityId = cRes.insertId;
    }
  } catch (e: any) {
    console.error("[addTaskComment DB Error]:", e?.message || e);
    return res.status(500).json({ error: "Failed to persist comment to database" });
  }

  const newActivity: ActivityItem = {
    id: activityId,
    taskId,
    previousStatus: task.status,
    newStatus: task.status,
    changedBy: userId,
    comment: commentText.trim(),
    durationSeconds: null,
    createdAt: new Date().toISOString(),
    // Backward compatibility aliases
    userId,
    userName,
    userRole
  };

  emitRealtimeEvent("task:comment_added", { taskId, comment: newActivity });
  emitRealtimeEvent("task:activity_created", { taskId, activity: newActivity });

  // Notify other party
  const notifyRecipientId = String(userId) === String(task.assignedTo) ? task.createdBy : task.assignedTo;
  if (notifyRecipientId) {
    await dispatchNotification({
      userId: notifyRecipientId,
      title: `New Comment on "${task.title}"`,
      message: `${userName}: "${newActivity.comment?.slice(0, 80)}${(newActivity.comment?.length || 0) > 80 ? "..." : ""}"`,
      type: "INFO",
      targetRoute: `/designer-tasks/${task.id}`
    });
  }

  return res.status(201).json({
    success: true,
    activity: newActivity,
    comment: newActivity
  });
}

export async function getTaskHistory(req: Request, res: Response): Promise<Response> {
  const rawTaskId = req.params.id || req.params.taskId || req.query.taskId || req.query.task_id;
  const taskId = parseInt(String(rawTaskId), 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "taskId is required" });
  }
  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  let activities: ActivityItem[] = [];

  try {
    const [rows]: any = await dbPool.query(
      `SELECT id, task_id as taskId, previous_status as previousStatus, new_status as newStatus, changed_by as changedBy, comment, duration_seconds as durationSeconds, created_at as createdAt
       FROM task_activities
       WHERE task_id = ?
       ORDER BY created_at DESC`,
      [taskId]
    );
    if (Array.isArray(rows)) {
      activities = rows.map((r: any) => ({
        ...r,
        actorId: r.changedBy,
        userId: r.changedBy,
        remark: r.comment,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }));
    }
  } catch (e: any) {
    console.error("[getTaskHistory DB Error]:", e?.message || e);
  }

  return res.json({
    success: true,
    activities,
    statusHistory: activities,
    comments: activities.filter((a) => a.comment),
    versions: task.deliverables || task.versions || []
  });
}
