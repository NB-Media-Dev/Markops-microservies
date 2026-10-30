import { Router } from "express";
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  uploadLeadsFromExcel,
  reassignTelecallerLeads,
  getTelecallingSummary,
  assignLead
} from "../controllers/leads.controller.js";
import { uploadExcelMiddleware } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/leads/telecalling-summary", getTelecallingSummary);
router.get("/leads", getLeads);
router.get("/leads/:id", getLeadById);
router.post("/leads", createLead);
router.post("/leads/upload-excel", uploadExcelMiddleware, uploadLeadsFromExcel);
router.post("/leads/reassign", reassignTelecallerLeads);
router.post("/leads/:id/assign", assignLead);

router.put("/leads/:id", updateLead);
router.patch("/leads/:id", updateLead);
router.delete("/leads/:id", deleteLead);

router.get("/campaigns/:campaignId/leads", (req, _res, next) => {
  req.query.campaignId = req.params.campaignId;
  next();
}, getLeads);

router.get("/ads/:adId/leads", (req, _res, next) => {
  req.query.adId = req.params.adId;
  next();
}, getLeads);

export default router;
