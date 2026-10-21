import { Router } from "express";
import { submitVersion, getTaskSubmissions } from "../controllers/version.controller.js";

const router = Router();

router.post("/tasks/:id/versions", submitVersion);
router.get("/tasks/:id/submissions", getTaskSubmissions);

export default router;

