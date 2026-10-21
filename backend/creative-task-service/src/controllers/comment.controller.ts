import type { Request, Response } from "express";
import { dbPool, dbTasksStore, type CommentItem } from "../config/db.js";
import { emitRealtimeEvent } from "../events/socket.events.js";
import { dispatchNotification } from "../services/notification.service.js";
import { findTask } from "./task.controller.js";

export async function addTaskComment(req: Request, res: Response): Promise<Response> {
  const taskId = req.params.id;
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
  const userId = user?.id || 1;
  const userName = user?.fullName || "User";
  const userRole = user?.role || "ADMINISTRATOR";

  const newComment: CommentItem = {
    id: Date.now(),
    taskId: Number(taskId),
    userId,
    userName,
    userRole,
    comment: commentText.trim(),
    createdAt: new Date().toISOString()
  };

  if (dbPool.isConnected()) {
    try {
      const [cRes] = await dbPool.query(
        `INSERT INTO task_comments (task_id, user_id, comment, created_at)
         VALUES (?, ?, ?, NOW())`,
        [taskId, userId, newComment.comment]
      );
      if (cRes && cRes.insertId) {
        newComment.id = cRes.insertId;
      }
    } catch (e: any) {
      console.warn("[addTaskComment DB Notice]:", e?.message || e);
    }
  }

  // Update in-memory store
  const mem = dbTasksStore.find((t) => String(t.id) === String(taskId));
  if (mem) {
    if (!mem.comments) mem.comments = [];
    mem.comments.push(newComment);
  }

  emitRealtimeEvent("task:comment_added", { taskId, comment: newComment });

  // Notify the other party
  const notifyRecipientId = String(userId) === String(task.assignedTo) ? task.createdBy : task.assignedTo;
  if (notifyRecipientId) {
    await dispatchNotification({
      userId: notifyRecipientId,
      title: `New Comment on "${task.title}"`,
      message: `${userName}: "${newComment.comment.slice(0, 80)}${newComment.comment.length > 80 ? "..." : ""}"`,
      type: "INFO",
      targetRoute: `/designer-tasks/${task.id}`
    });
  }

  return res.status(201).json({
    success: true,
    comment: newComment
  });
}

export async function getTaskHistory(req: Request, res: Response): Promise<Response> {
  const taskId = req.params.id;
  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  return res.json({
    success: true,
    statusHistory: task.statusHistory || [],
    versions: task.versions || []
  });
}

