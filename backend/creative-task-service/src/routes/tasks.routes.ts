import { requireRole } from "../middleware/auth.middleware.js";
import { Router } from "express";
import {
  getTasks,
  getMyTasks,
  getTaskById,
  createTask,
  deleteTask,
  handleStatusTransition,
  startTask,
  submitTask,
  approveTask,
  redesignTask,
  startRedesignTask
} from "../controllers/task.controller.js";
import {
  validateCreateTask,
  validateStatusTransition
} from "../middleware/task-validation.middleware.js";

const router = Router();


router.get("/tasks", getTasks);
router.get("/tasks/my", getMyTasks);
router.post("/tasks", requireRole("ADMIN", "ADMINISTRATOR", "BDM"), validateCreateTask, createTask);

// Single Task Endpoints
router.get("/tasks/:id", getTaskById);
router.delete("/tasks/:id", deleteTask);

// Workflow Action Endpoints
router.post("/tasks/:id/start", startTask);
router.post("/tasks/:id/submit", submitTask);
router.post("/tasks/:id/approve", approveTask);
router.post("/tasks/:id/redesign", redesignTask);
router.post("/tasks/:id/start-redesign", startRedesignTask);

// State Transition Generic Endpoints
router.post("/tasks/:id/status", validateStatusTransition, handleStatusTransition);
router.put("/tasks/:id/status", validateStatusTransition, handleStatusTransition);
router.patch("/tasks/:id/status", validateStatusTransition, handleStatusTransition);

export default router;
