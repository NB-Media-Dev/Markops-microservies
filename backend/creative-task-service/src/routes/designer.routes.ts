import { Router } from "express";
import { getDesignerDashboardMetrics, getDesignersDirectory } from "../controllers/designer.controller.js";

const router = Router();

// Metrics (support both singular and plural)
router.get("/designer/dashboard-metrics", getDesignerDashboardMetrics);
router.get("/designers/dashboard-metrics", getDesignerDashboardMetrics);

// Directory (support both plural and singular)
router.get("/designers", getDesignersDirectory);
router.get("/designer", getDesignersDirectory);

export default router;
