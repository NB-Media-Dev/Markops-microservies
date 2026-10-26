import { Router } from "express";
import {
  getFollowUps,
  completeFollowUp
} from "../controllers/follow-ups.controller.js";

const router = Router();

router.get("/follow-ups", getFollowUps);
router.patch("/follow-ups/:callLogId/complete", completeFollowUp);
router.put("/follow-ups/:callLogId/complete", completeFollowUp);

export default router;

