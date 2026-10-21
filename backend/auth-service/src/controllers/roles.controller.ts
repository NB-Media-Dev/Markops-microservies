import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/database.js";

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

function formatRole(row: any): Role {
  return {
    ...row,
    permissions: typeof row.permissions === "string"
      ? JSON.parse(row.permissions)
      : (row.permissions || [])
  };
}

export async function findRoleById(id: string): Promise<Role | null> {
  const [rows] = await pool.query("SELECT * FROM Role WHERE id = ?", [id]);
  const roles = rows as any[];
  return roles.length > 0 ? formatRole(roles[0]) : null;
}

export async function findRoleByName(name: string): Promise<Role | null> {
  const [rows] = await pool.query("SELECT * FROM Role WHERE UPPER(name) = UPPER(?)", [name]);
  const roles = rows as any[];
  return roles.length > 0 ? formatRole(roles[0]) : null;
}

export async function getRolesController(_req: Request, res: Response, next: NextFunction) {
  try {
    const [rows] = await pool.query("SELECT * FROM Role");
    const roles = (rows as any[]).map(formatRole);

    return res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoleByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const role = await findRoleById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
}
