import type { Request, Response } from "express";
import { dbPool, dbTasksStore, type VersionItem } from "../config/db.js";
import { saveBase64Attachment } from "../middleware/upload.middleware.js";
import { emitRealtimeEvent } from "../events/socket.events.js";
import { dispatchNotification } from "../services/notification.service.js";
import { findTask } from "./task.controller.js";

export async function submitVersion(req: Request, res: Response): Promise<Response> {
  const taskId = req.params.id;
  const { fileName, fileData, fileContent, changelog, fileSize = 0, mimeType = "image/png" } = req.body;
  const user = (req as any).user;
  const submitterId = user?.id || 2;
  const submitterName = user?.fullName || "Creative Designer";

  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Save the design version file
  const rawData = fileData || fileContent;
  const savedFilePath = saveBase64Attachment(rawData, fileName || "design_version.png", "designs") || "";
  const nextVersionNumber = (task.versions && task.versions.length > 0)
    ? Math.max(...task.versions.map((v) => v.versionNumber || 1)) + 1
    : 1;

  const newVersion: VersionItem = {
    id: Date.now(),
    taskId: Number(taskId),
    versionNumber: nextVersionNumber,
    submittedBy: submitterId,
    submittedByName: submitterName,
    fileName: fileName || `design_v${nextVersionNumber}.png`,
    filePath: savedFilePath,
    fileSize: Number(fileSize) || 1250000,
    mimeType: mimeType || "image/png",
    changelog: changelog || `Version ${nextVersionNumber} submission`,
    createdAt: new Date().toISOString()
  };

  if (dbPool.isConnected()) {
    try {
      const [vRes] = await dbPool.query(
        `INSERT INTO task_versions (task_id, version_number, submitted_by, file_name, file_path, file_size, mime_type, changelog, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          taskId,
          nextVersionNumber,
          submitterId,
          newVersion.fileName,
          newVersion.filePath,
          newVersion.fileSize,
          newVersion.mimeType,
          newVersion.changelog
        ]
      );
      if (vRes && vRes.insertId) {
        newVersion.id = vRes.insertId;
      }

      // Update task status to SUBMITTED
      await dbPool.query(
        `UPDATE tasks
         SET status = 'SUBMITTED', progress_percent = 80, updated_at = NOW()
         WHERE id = ?`,
        [taskId]
      );

      // Audit status transition
      await dbPool.query(
        `INSERT INTO task_status_history (task_id, actor_id, previous_status, new_status, remark, created_at)
         VALUES (?, ?, ?, 'SUBMITTED', ?, NOW())`,
        [taskId, submitterId, task.status, `Submitted Version ${nextVersionNumber}: ${newVersion.changelog}`]
      );
    } catch (e: any) {
      console.warn("[submitVersion DB Notice]:", e?.message || e);
    }
  }

  // Update in-memory store
  const mem = dbTasksStore.find((t) => String(t.id) === String(taskId));
  if (mem) {
    if (!mem.versions) mem.versions = [];
    mem.versions.unshift(newVersion);
    mem.status = "SUBMITTED";
    mem.progressPercent = 80;
    mem.updatedAt = new Date().toISOString();
    if (!mem.statusHistory) mem.statusHistory = [];
    mem.statusHistory.unshift({
      id: Date.now(),
      taskId: Number(taskId),
      actorId: submitterId,
      actorName: submitterName,
      previousStatus: task.status,
      newStatus: "SUBMITTED",
      remark: `Submitted Version ${nextVersionNumber}`,
      createdAt: new Date().toISOString()
    });
  }

  const updatedTask = await findTask(taskId);
  emitRealtimeEvent("task:version_submitted", { taskId, version: newVersion });
  emitRealtimeEvent("task:status_changed", updatedTask);
  emitRealtimeEvent("task:updated", updatedTask);

  await dispatchNotification({
    userId: task.createdBy,
    title: `Version ${nextVersionNumber} Uploaded`,
    message: `${submitterName} submitted design version ${nextVersionNumber} for "${task.title}".`,
    type: "INFO",
    targetRoute: `/designer-tasks/${task.id}`
  });

  return res.status(201).json({
    success: true,
    version: newVersion,
    task: updatedTask
  });
}

export async function getTaskSubmissions(req: Request, res: Response): Promise<Response> {
  const taskId = req.params.id;
  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  return res.json({
    success: true,
    versions: task.versions || []
  });
}

