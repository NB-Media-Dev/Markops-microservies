import { Router } from "express";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} from "../controllers/package.controller.js";

const router = Router();

router.get("/packages", getAllPackages);
router.get("/packages/:id", getPackageById);
router.post("/packages", createPackage);
router.put("/packages/:id", updatePackage);
router.delete("/packages/:id", deletePackage);

export default router;
