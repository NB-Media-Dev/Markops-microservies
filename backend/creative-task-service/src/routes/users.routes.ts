import { Router } from "express";
import { dbPool, dbUsersStore } from "../config/db.js";

const router = Router();

router.get("/users", async (_req, res) => {
  if (dbPool.isConnected()) {
    try {
      const [rows] = await dbPool.query(`
        SELECT u.id, u.email, u.full_name as fullName, r.code as role, u.department, u.avatar_url as avatarUrl, u.is_active as isActive
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.is_active = 1
        ORDER BY u.full_name ASC
      `);
      if (Array.isArray(rows) && rows.length > 0) {
        return res.json(rows);
      }
    } catch (e: any) {
      console.warn("[Users DB Notice]:", e?.message || e);
    }
  }

  return res.json(dbUsersStore);
});

router.get("/auth/me", (req, res) => {
  const user = (req as any).user;
  res.json({
    success: true,
    user: user || {
      id: 2,
      email: "designer@markops.io",
      fullName: "Creative Designer",
      role: "DESIGNER",
      department: "Creative Design Studio",
      isActive: true
    }
  });
});

export default router;

