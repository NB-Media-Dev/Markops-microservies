import { Router } from "express";
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignMetrics
} from "../controllers/campaigns.controller.js";

const router = Router();

// Metrics summary (must come before /:id)
router.get("/campaigns/metrics", getCampaignMetrics);


// Core CRUD
router.get("/campaigns", getCampaigns);
router.get("/campaigns/:id", getCampaignById);
router.post("/campaigns", createCampaign);
router.put("/campaigns/:id", updateCampaign);
router.patch("/campaigns/:id", updateCampaign);
router.delete("/campaigns/:id", deleteCampaign);

export default router;

