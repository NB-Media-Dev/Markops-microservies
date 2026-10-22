import type { Request, Response, NextFunction } from "express";

const ALLOWED_TASK_TYPES = ["BANNER", "POSTER", "VIDEO", "BANNER_DESIGN"];
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const ALLOWED_STATUSES = [
  "DRAFT",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "REDESIGN_REQUIRED",
  "RESUBMITTED",
  "APPROVED",
  "PUBLISHED",
  "COMPLETED"
];

export function validateCreateTask(req: Request, res: Response, next: NextFunction): void {
  const { title, taskType, task_type, priority, status } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ success: false, error: "Validation Error: 'title' is required" });
    return;
  }

  const type = (taskType || task_type || "BANNER").toUpperCase();
  if (!ALLOWED_TASK_TYPES.includes(type)) {
    res.status(400).json({
      success: false,
      error: `Validation Error: Invalid taskType '${type}'. Allowed: [BANNER, POSTER, VIDEO]`
    });
    return;
  }

  if (priority) {
    const prio = String(priority).toUpperCase();
    if (!ALLOWED_PRIORITIES.includes(prio)) {
      res.status(400).json({
        success: false,
        error: `Validation Error: Invalid priority '${prio}'. Allowed: [LOW, MEDIUM, HIGH, URGENT]`
      });
      return;
    }
  }

  if (status) {
    const stat = String(status).toUpperCase();
    if (!ALLOWED_STATUSES.includes(stat)) {
      res.status(400).json({
        success: false,
        error: `Validation Error: Invalid status '${stat}'. Allowed: [${ALLOWED_STATUSES.join(", ")}]`
      });
      return;
    }
  }

  next();
}

export function validateStatusTransition(req: Request, res: Response, next: NextFunction): void {
  const { status } = req.body;

  if (status) {
    const stat = String(status).toUpperCase();
    if (!ALLOWED_STATUSES.includes(stat)) {
      res.status(400).json({
        success: false,
        error: `Validation Error: Invalid status '${stat}'. Allowed: [${ALLOWED_STATUSES.join(", ")}]`
      });
      return;
    }
  }

  next();
}

