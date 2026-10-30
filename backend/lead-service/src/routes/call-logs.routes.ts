import { Router } from "express";
import {
  createCallLog,
  getCallLogs,
  getCallLogById,
  updateCallLog,
  deleteCallLog,
  getLeadCallHistory
} from "../controllers/call-logs.controller.js";

const router = Router();

router.post("/call-logs", createCallLog);
router.post("/calls", createCallLog);

router.get("/call-logs", getCallLogs);
router.get("/calls", getCallLogs);

router.get("/call-logs/:id", getCallLogById);
router.get("/calls/:id", getCallLogById);

router.put("/call-logs/:id", updateCallLog);
router.put("/calls/:id", updateCallLog);

router.patch("/call-logs/:id", updateCallLog);
router.patch("/calls/:id", updateCallLog);

router.delete("/call-logs/:id", deleteCallLog);
router.delete("/calls/:id", deleteCallLog);

router.get("/leads/:leadId/call-logs", getLeadCallHistory);
router.get("/leads/:leadId/calls", getLeadCallHistory);

export default router;
