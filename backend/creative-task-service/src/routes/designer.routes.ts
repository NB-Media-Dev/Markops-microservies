import { Router } from "express";
import { getDesignerDashboardMetrics, getDesignersDirectory } from "../controllers/designer.controller.js";

const router = Router();

router.get("/designer/dashboard-metrics", getDesignerDashboardMetrics);
router.get("/designers", getDesignersDirectory);

export default router;

