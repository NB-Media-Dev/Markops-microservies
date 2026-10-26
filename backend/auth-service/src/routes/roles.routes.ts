import { Router } from "express";
import {
  getRolesController,
  getRoleByIdController,
} from "../controllers/roles.controller.js";
import { validateParams } from "../middleware/validation.middleware.js";
import { idParamSchema } from "../validators/auth.validator.js";

const router = Router();

// GET /roles
router.get("/", getRolesController);

// GET /roles/:id
router.get("/:id", validateParams(idParamSchema), getRoleByIdController);

export default router;
