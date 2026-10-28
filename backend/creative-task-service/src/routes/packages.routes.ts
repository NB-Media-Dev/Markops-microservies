import { Router } from "express";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} from "../controllers/package.controller.js";
import { authenticateJwt, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/packages", getAllPackages);
router.get("/packages/:id", getPackageById);
router.post("/packages", authenticateJwt(), requireRole("ADMIN", "ADMINISTRATOR"), createPackage);
router.put("/packages/:id", authenticateJwt(), requireRole("ADMIN", "ADMINISTRATOR"), updatePackage);
router.delete("/packages/:id", authenticateJwt(), requireRole("ADMIN", "ADMINISTRATOR"), deletePackage);

export default router;
