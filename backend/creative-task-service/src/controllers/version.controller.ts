import type { Request, Response } from "express";
import {
  dbPool,
  type DeliverableItem,
  type ActivityItem
} from "../config/db.js";
import { saveBase64Attachment } from "../middleware/upload.middleware.js";
import { emitRealtimeEvent } from "../events/socket.events.js";
import { dispatchNotification } from "../services/notification.service.js";
import { findTask } from "./task.controller.js";

export async function submitVersion(req: Request, res: Response): Promise<Response> {
  const rawTaskId = req.params.id || req.params.taskId || req.body.taskId || req.body.task_id;
  const taskId = parseInt(String(rawTaskId), 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "taskId is required" });
  }
  const {
    fileName,
    fileData,
    fileContent,
    changelog,
    fileSize = 0,
    mimeType = "image/png",
    assetType = "DESIGN_SUBMISSION"
  } = req.body;

  const user = (req as any).user;
  const submitterId = parseInt(String(user?.id || 2), 10);
  const submitterName = user?.fullName || "Creative Designer";

  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Save the design version file
  const rawData = fileData || fileContent;
  const savedFilePath = saveBase64Attachment(rawData, fileName || "design_version.png", "designs") || "";

  // Compute next version number for DESIGN_SUBMISSION
  let nextVersionNumber = 1;
  try {
    const [verRows]: any = await dbPool.query(
      "SELECT MAX(version_number) as maxVer FROM task_deliverables WHERE task_id = ? AND asset_type = ?",
      [taskId, assetType]
    );
    if (Array.isArray(verRows) && verRows[0]?.maxVer) {
      nextVersionNumber = Number(verRows[0].maxVer) + 1;
    }
  } catch (e: any) {
    console.warn("[submitVersion DB maxVer Warning]:", e?.message || e);
  }

  let deliverableId = Date.now();
  let activityId = Date.now() + 1;

  try {
    // 1. Insert deliverable
    const [vRes]: any = await dbPool.query(
      `INSERT INTO task_deliverables (task_id, user_id, asset_type, version_number, file_name, file_path, file_size, mime_type, changelog, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        taskId,
        submitterId,
        assetType,
        nextVersionNumber,
        fileName || `design_v${nextVersionNumber}.png`,
        savedFilePath,
        Number(fileSize) || 1250000,
        mimeType || "image/png",
        changelog || `Version ${nextVersionNumber} submission`
      ]
    );
    if (vRes && vRes.insertId) {
      deliverableId = vRes.insertId;
    }

    // 2. Update tasks table status to SUBMITTED
    await dbPool.query(
      `UPDATE tasks
       SET status = 'SUBMITTED', progress_percent = 80, updated_at = NOW()
       WHERE id = ?`,
      [taskId]
    );

    // 3. Insert into task_activities
    const comment = `Submitted Version ${nextVersionNumber}: ${changelog || `Version ${nextVersionNumber} submission`}`;
    const [aRes]: any = await dbPool.query(
      `INSERT INTO task_activities (task_id, previous_status, new_status, changed_by, comment, created_at)
       VALUES (?, ?, 'SUBMITTED', ?, ?, NOW())`,
      [taskId, task.status, submitterId, comment]
    );
    if (aRes && aRes.insertId) {
      activityId = aRes.insertId;
    }
  } catch (e: any) {
    console.error("[submitVersion DB Error]:", e?.message || e);
    return res.status(500).json({ error: "Failed to persist version submission to database" });
  }

  const newDeliverable: DeliverableItem = {
    id: deliverableId,
    taskId,
    userId: submitterId,
    assetType,
    versionNumber: nextVersionNumber,
    fileName: fileName || `design_v${nextVersionNumber}.png`,
    filePath: savedFilePath,
    fileSize: Number(fileSize) || 1250000,
    mimeType: mimeType || "image/png",
    changelog: changelog || `Version ${nextVersionNumber} submission`,
    createdAt: new Date().toISOString(),
    // Backward compatibility aliases
    submittedBy: submitterId,
    submittedByName: submitterName
  };

  const updatedTask = await findTask(taskId);
  emitRealtimeEvent("task:version_submitted", { taskId, version: newDeliverable });
  emitRealtimeEvent("task:deliverable_created", { taskId, deliverable: newDeliverable });
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
    version: newDeliverable,
    deliverable: newDeliverable,
    task: updatedTask
  });
}

export async function getTaskSubmissions(req: Request, res: Response): Promise<Response> {
  const rawTaskId = req.params.id || req.params.taskId || req.query.taskId || req.query.task_id;
  const taskId = parseInt(String(rawTaskId), 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "taskId is required" });
  }
  const task = await findTask(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  let deliverables: DeliverableItem[] = [];

  try {
    const [rows]: any = await dbPool.query(
      `SELECT id, task_id as taskId, user_id as userId, asset_type as assetType, version_number as versionNumber, file_name as fileName, file_path as filePath, file_size as fileSize, mime_type as mimeType, changelog, created_at as createdAt
       FROM task_deliverables
       WHERE task_id = ?
       ORDER BY version_number DESC, id DESC`,
      [taskId]
    );
    if (Array.isArray(rows)) {
      deliverables = rows.map((r: any) => ({
        ...r,
        submittedBy: r.userId,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }));
    }
  } catch (e: any) {
    console.error("[getTaskSubmissions DB Error]:", e?.message || e);
    return res.status(500).json({ error: "Failed to fetch deliverables" });
  }

  return res.json({
    success: true,
    deliverables,
    versions: deliverables
  });
}
