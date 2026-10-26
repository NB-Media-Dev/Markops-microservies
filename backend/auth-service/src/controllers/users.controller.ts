import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/database.js";
import { hashPassword } from "../services/password.service.js";

export interface User {
  id: string | number;
  name: string;
  email: string;
  passwordHash: string;
  avatar_image?: string | null;
  roleId: string;
  department?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function sanitizeUser(user: any): any {
  const { passwordHash: _, password: __, ...safeUser } = user;
  return {
    ...safeUser,
    fullName: safeUser.fullName || safeUser.name,
    role: safeUser.role || safeUser.roleId,
    avatarUrl: safeUser.avatarUrl || safeUser.avatar_image
  };
}

// Database helper queries
export async function findUserById(id: string | number): Promise<User | null> {
  const [rows]: any = await pool.execute(
    `SELECT u.id, u.name, u.email, u.password AS passwordHash, u.avatar_image, u.roleId, u.department, u.isActive, u.createdAt, u.updatedAt,
            r.name as roleName
     FROM User u
     LEFT JOIN Role r ON u.roleId = r.id
     WHERE u.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const lowercaseEmail = email.toLowerCase().trim();
  const [rows]: any = await pool.execute(
    `SELECT u.id, u.name, u.email, u.password AS passwordHash, u.avatar_image, u.roleId, u.department, u.isActive, u.createdAt, u.updatedAt,
            r.name as roleName
     FROM User u
     LEFT JOIN Role r ON u.roleId = r.id
     WHERE u.email = ?`,
    [lowercaseEmail]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function resolveRoleId(roleInput?: string): Promise<string | null> {
  if (!roleInput || roleInput.trim() === "") {
    return "telecaller"; // Default role
  }

  const trimmed = roleInput.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s_]+/g, "-");

  const [roleRows]: any = await pool.execute(
    "SELECT id FROM Role WHERE id = ? OR id = ? OR UPPER(name) = UPPER(?) OR UPPER(REPLACE(name, ' ', '_')) = UPPER(?) LIMIT 1",
    [trimmed, normalized, trimmed, trimmed]
  );

  if (roleRows.length > 0) {
    return roleRows[0].id;
  }

  return "telecaller";
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  department?: string | null;
  avatar_image?: string | null;
  isActive?: boolean;
}): Promise<User> {
  const activeStatus = data.isActive !== undefined ? data.isActive : true;
  const lowercaseEmail = data.email.toLowerCase().trim();
  const avatar: string | null = data.avatar_image !== undefined ? data.avatar_image : null;
  const targetRoleId = (await resolveRoleId(data.role)) || "telecaller";
  const dept = data.department || "General Operations";

  const insertQuery = `
    INSERT INTO User (name, email, password, avatar_image, roleId, department, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3));
  `;

  await pool.execute(insertQuery, [
    data.name.trim(),
    lowercaseEmail,
    data.passwordHash,
    avatar,
    targetRoleId,
    dept,
    activeStatus
  ] as any[]);

  const createdUser = await findUserByEmail(lowercaseEmail);
  if (!createdUser) throw new Error("Failed to retrieve newly created user from database.");
  return createdUser;
}

// HTTP Controllers
export async function getUsersController(_req: Request, res: Response, next: NextFunction) {
  try {
    const [rows]: any = await pool.execute(
      `SELECT u.id, u.name, u.name as fullName, u.email, u.avatar_image, u.avatar_image as avatarUrl,
              u.roleId, u.roleId as role, r.name as roleName, u.department,
              u.isActive, u.createdAt, u.updatedAt
       FROM User u
       LEFT JOIN Role r ON u.roleId = r.id
       ORDER BY u.id ASC`
    );

    const formatted = rows.map((r: any) => ({
      id: String(r.id),
      email: r.email,
      name: r.name,
      fullName: r.fullName || r.name,
      role: r.roleId,
      roleName: r.roleName || r.roleId,
      department: r.department || "General Operations",
      isActive: Boolean(r.isActive),
      avatarUrl: r.avatarUrl || undefined,
      lastLoginAt: "Recently",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "2026-01-01"
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
}

export async function getUserByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await findUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function createUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, fullName, email, password, role, roleId, department, avatar_image, avatarUrl, isActive } = req.body;

    const inputName = String(fullName || name || "").trim();
    if (!inputName || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required fields" });
    }

    const inputRole = roleId || role;
    const targetRoleId = await resolveRoleId(inputRole);

    const rawPassword = password && String(password).length > 0 ? String(password) : "admin123";
    const passwordHash = await hashPassword(rawPassword);

    // If an image file was uploaded via multer, use its saved relative URL path
    let resolvedAvatar: string | null = avatar_image || avatarUrl || null;
    if (req.file) {
      resolvedAvatar = `/uploads/avatars/${req.file.filename}`;
    }

    const newUser = await createUser({
      name: inputName,
      email,
      passwordHash,
      role: targetRoleId || "telecaller",
      department: department || "General Operations",
      avatar_image: resolvedAvatar,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    const sanitized = sanitizeUser(newUser);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      id: String(sanitized.id),
      email: sanitized.email,
      fullName: sanitized.fullName || sanitized.name,
      role: sanitized.role || sanitized.roleId,
      department: sanitized.department,
      isActive: sanitized.isActive,
      avatarUrl: sanitized.avatarUrl,
      data: sanitized
    });
  } catch (error: any) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A user with this email address already exists"
      });
    }
    next(error);
  }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const currentUser = await findUserById(id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { name, fullName, email, password, avatar_image, avatarUrl, role, roleId, department, isActive } = req.body;

    const updatedName = (fullName || name) !== undefined ? String(fullName || name).trim() : currentUser.name;
    const updatedEmail = email !== undefined ? email.toLowerCase().trim() : currentUser.email;
    const updatedDepartment = department !== undefined ? department : (currentUser.department || "General Operations");

    let updatedPassword = currentUser.passwordHash;
    if (password && password.trim().length > 0) {
      updatedPassword = await hashPassword(password);
    }

    // Handle avatar image from multer file upload or JSON payload
    let updatedAvatar: string | null = currentUser.avatar_image ?? null;
    if (req.file) {
      updatedAvatar = `/uploads/avatars/${req.file.filename}`;
    } else if (avatar_image !== undefined || avatarUrl !== undefined) {
      updatedAvatar = avatar_image || avatarUrl;
    }

    const updatedIsActive = isActive !== undefined ? (Boolean(isActive) ? 1 : 0) : currentUser.isActive;

    let updatedRoleId = currentUser.roleId;
    const inputRole = roleId || role;
    if (inputRole !== undefined) {
      const resolved = await resolveRoleId(inputRole);
      if (resolved) {
        updatedRoleId = resolved;
      }
    }

    const updateQuery = `
      UPDATE User
      SET name = ?, email = ?, password = ?, avatar_image = ?, roleId = ?, department = ?, isActive = ?, updatedAt = NOW(3)
      WHERE id = ?
    `;

    await pool.execute(updateQuery, [
      updatedName,
      updatedEmail,
      updatedPassword,
      updatedAvatar,
      updatedRoleId,
      updatedDepartment,
      updatedIsActive,
      id
    ] as any[]);

    const updatedUser = await findUserById(id);
    const sanitized = updatedUser ? sanitizeUser(updatedUser) : null;

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: sanitized,
      ...(sanitized || {})
    });
  } catch (error: any) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email is already taken by another user"
      });
    }
    next(error);
  }
}

export async function toggleUserStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [rows]: any = await pool.execute("SELECT isActive FROM User WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentStatus = Boolean(rows[0].isActive);
    const newStatus = !currentStatus;

    await pool.execute("UPDATE User SET isActive = ?, updatedAt = NOW(3) WHERE id = ?", [newStatus ? 1 : 0, id]);

    return res.status(200).json({
      success: true,
      message: `User status changed to ${newStatus ? 'Active' : 'Inactive'}`,
      isActive: newStatus
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminMetricsController(_req: Request, res: Response, next: NextFunction) {
  try {
    const [userStats]: any = await pool.execute(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactiveUsers
      FROM User
    `);

    const [roleDistribution]: any = await pool.execute(`
      SELECT r.name as roleName, r.id as roleId, COUNT(u.id) as userCount
      FROM Role r
      LEFT JOIN User u ON u.roleId = r.id
      GROUP BY r.id, r.name
    `);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: Number(userStats[0]?.totalUsers || 0),
        activeUsers: Number(userStats[0]?.activeUsers || 0),
        inactiveUsers: Number(userStats[0]?.inactiveUsers || 0),
        roleDistribution
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const [result]: any = await pool.execute("DELETE FROM User WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}
