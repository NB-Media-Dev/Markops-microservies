import { Router } from "express";
import { addTaskComment, getTaskHistory } from "../controllers/comment.controller.js";
import { findTask } from "../controllers/task.controller.js";

const router = Router();

// Add comment / activity
router.post("/tasks/:id/comments", addTaskComment);
router.post("/tasks/:id/messages", addTaskComment);
router.post("/tasks/:id/activities", addTaskComment);
router.post("/comments/:taskId", addTaskComment);
router.post("/comments", addTaskComment);

// Get activities / comments history
router.get("/tasks/:id/history", getTaskHistory);
router.get("/tasks/:id/activities", getTaskHistory);
router.get("/comments/:taskId", getTaskHistory);
router.get("/comments", getTaskHistory);

router.get("/tasks/:id/comments", async (req, res) => {
  const task = await findTask(req.params.id);
  res.json(task?.activities?.filter((a) => a.comment) || task?.comments || []);
});

router.get("/tasks/:id/messages", async (req, res) => {
  const task = await findTask(req.params.id);
  res.json(task?.activities?.filter((a) => a.comment) || task?.comments || []);
});

export default router;
