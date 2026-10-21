import { Router } from "express";
import {
  getUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController
} from "../controllers/users.controller.js";
import { validateBody, validateParams } from "../middleware/validation.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { createUserSchema, updateUserSchema, idParamSchema } from "../validators/auth.validator.js";

const router = Router();

// GET /users
router.get("/", getUsersController);

// GET /users/:id
router.get("/:id", validateParams(idParamSchema), getUserByIdController);

// POST /users 
router.post("/", uploadAvatar, validateBody(createUserSchema), createUserController);

// PUT /users/:id 
router.put("/:id", uploadAvatar, validateParams(idParamSchema), validateBody(updateUserSchema), updateUserController);

// DELETE /users/:id
router.delete("/:id", validateParams(idParamSchema), deleteUserController);

export default router;
