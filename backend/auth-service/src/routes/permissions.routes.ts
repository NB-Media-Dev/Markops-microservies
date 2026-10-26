import { Router } from "express";
import {
  getPermissionsController,
} from "../controllers/permissions.controller.js";


const router = Router();

// GET /permissions
router.get("/", getPermissionsController);



export default router;

