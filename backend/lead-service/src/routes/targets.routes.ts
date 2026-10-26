import { Router } from "express";
import {
  getAllTargets,
  getTargetByTelecallerId,
  upsertTarget,
  getTelecallerProgress
} from "../controllers/targets.controller.js";

const router = Router();


router.get("/targets", getAllTargets);
router.get("/targets/:telecallerId", getTargetByTelecallerId);
router.post("/targets", upsertTarget);
router.put("/targets/:telecallerId", upsertTarget);
router.get("/targets/:telecallerId/progress", getTelecallerProgress);

export default router;

