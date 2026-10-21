import { Router } from "express";
import { addTaskComment, getTaskHistory } from "../controllers/comment.controller.js";
import { findTask } from "../controllers/task.controller.js";

const router = Router();

router.post("/tasks/:id/comments", addTaskComment);
router.post("/tasks/:id/messages", addTaskComment);
router.get("/tasks/:id/messages", async (req, res) => {
  const task = await findTask(req.params.id);
  res.json(task?.comments || []);
});
router.get("/tasks/:id/history", getTaskHistory);

export default router;

