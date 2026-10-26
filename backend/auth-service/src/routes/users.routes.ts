import { Router } from "express";
import {
  getUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController,
  toggleUserStatusController,
  getAdminMetricsController
} from "../controllers/users.controller.js";
import { validateBody, validateParams } from "../middleware/validation.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { createUserSchema, updateUserSchema, idParamSchema } from "../validators/auth.validator.js";

const router = Router();

// GET /users/metrics or /users/summary
router.get("/metrics", getAdminMetricsController);
router.get("/summary", getAdminMetricsController);

// GET /users
router.get("/", getUsersController);

// GET /users/:id
router.get("/:id", validateParams(idParamSchema), getUserByIdController);

// POST /users 
router.post("/", uploadAvatar, createUserController);

// PUT /users/:id 
router.put("/:id", uploadAvatar, validateParams(idParamSchema), updateUserController);

// PATCH /users/:id/toggle-status
router.patch("/:id/toggle-status", validateParams(idParamSchema), toggleUserStatusController);
router.patch("/:id", uploadAvatar, validateParams(idParamSchema), updateUserController);

// DELETE /users/:id
router.delete("/:id", validateParams(idParamSchema), deleteUserController);

export default router;
