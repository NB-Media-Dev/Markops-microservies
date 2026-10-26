import { Router } from "express";
import {
  getDashboardMetrics,
  getLeaderboard
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/telecalling/dashboard-metrics", getDashboardMetrics);
router.get("/telecalling/metrics", getDashboardMetrics);
router.get("/telecalling/leaderboard", getLeaderboard);

export default router;

