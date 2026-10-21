import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/database.js";

export async function getPermissionsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const [rows] = await pool.query("SELECT * FROM Permission");
    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}
