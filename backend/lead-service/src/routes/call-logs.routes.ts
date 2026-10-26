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
router.get("/call-logs", getCallLogs);
router.get("/call-logs/:id", getCallLogById);
router.put("/call-logs/:id", updateCallLog);
router.patch("/call-logs/:id", updateCallLog);
router.delete("/call-logs/:id", deleteCallLog);


router.get("/leads/:leadId/call-logs", getLeadCallHistory);

export default router;

