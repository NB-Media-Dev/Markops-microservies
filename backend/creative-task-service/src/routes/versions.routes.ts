import { Router } from "express";
import { submitVersion, getTaskSubmissions } from "../controllers/version.controller.js";

const router = Router();

// Submit version / deliverable
router.post("/tasks/:id/versions", submitVersion);
router.post("/tasks/:id/deliverables", submitVersion);
router.post("/versions/:taskId", submitVersion);
router.post("/versions", submitVersion);
router.post("/deliverables/:taskId", submitVersion);
router.post("/deliverables", submitVersion);

// Get versions / deliverables
router.get("/tasks/:id/submissions", getTaskSubmissions);
router.get("/tasks/:id/versions", getTaskSubmissions);
router.get("/tasks/:id/deliverables", getTaskSubmissions);
router.get("/versions/:taskId", getTaskSubmissions);
router.get("/versions", getTaskSubmissions);
router.get("/deliverables/:taskId", getTaskSubmissions);
router.get("/deliverables", getTaskSubmissions);

export default router;
