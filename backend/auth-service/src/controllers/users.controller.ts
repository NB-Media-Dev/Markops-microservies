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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function sanitizeUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

// Database helper queries
export async function findUserById(id: string | number): Promise<User | null> {
  const [rows]: any = await pool.execute(
    "SELECT id, name, email, password AS passwordHash, avatar_image, roleId, isActive, createdAt, updatedAt FROM User WHERE id = ?",
    [id]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const lowercaseEmail = email.toLowerCase().trim();
  const [rows]: any = await pool.execute(
    "SELECT id, name, email, password AS passwordHash, avatar_image, roleId, isActive, createdAt, updatedAt FROM User WHERE email = ?",
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
  const [roleRows]: any = await pool.execute(
    "SELECT id FROM Role WHERE id = ? OR UPPER(name) = UPPER(?) LIMIT 1",
    [trimmed, trimmed]
  );

  if (roleRows.length > 0) {
    return roleRows[0].id;
  }

  return null;
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  avatar_image?: string | null;
  isActive?: boolean;
}): Promise<User> {
  const activeStatus = data.isActive !== undefined ? data.isActive : true;
  const lowercaseEmail = data.email.toLowerCase().trim();
  const avatar: string | null = data.avatar_image !== undefined ? data.avatar_image : null;
  const targetRoleId = (await resolveRoleId(data.role)) || "telecaller";

  const insertQuery = `
    INSERT INTO User (name, email, password, avatar_image, roleId, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3));
  `;

  await pool.execute(insertQuery, [
    data.name.trim(),
    lowercaseEmail,
    data.passwordHash,
    avatar,
    targetRoleId,
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
      "SELECT id, name, email, avatar_image, roleId, isActive, createdAt, updatedAt FROM User"
    );
    return res.status(200).json({
      success: true,
      data: rows
    });
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
    const { name, email, password, role, roleId, avatar_image, isActive } = req.body;

    const inputRole = roleId || role;
    const targetRoleId = await resolveRoleId(inputRole);

    if (!targetRoleId) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified: ${inputRole}`
      });
    }

    const passwordHash = await hashPassword(password);

    // If an image file was uploaded via multer, use its saved relative URL path
    let resolvedAvatar: string | null = avatar_image ?? null;
    if (req.file) {
      resolvedAvatar = `/uploads/avatars/${req.file.filename}`;
    }

    const newUser = await createUser({
      name,
      email,
      passwordHash,
      role: targetRoleId,
      avatar_image: resolvedAvatar,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: sanitizeUser(newUser)
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

    const { name, email, password, avatar_image, role, roleId, isActive } = req.body;

    const updatedName = name !== undefined ? name : currentUser.name;
    const updatedEmail = email !== undefined ? email.toLowerCase().trim() : currentUser.email;

    let updatedPassword = currentUser.passwordHash;
    if (password && password.trim().length > 0) {
      updatedPassword = await hashPassword(password);
    }

    // Handle avatar image from multer file upload or JSON payload
    let updatedAvatar: string | null = currentUser.avatar_image ?? null;
    if (req.file) {
      updatedAvatar = `/uploads/avatars/${req.file.filename}`;
    } else if (avatar_image !== undefined) {
      updatedAvatar = avatar_image;
    }

    const updatedIsActive = isActive !== undefined ? isActive : currentUser.isActive;

    let updatedRoleId = currentUser.roleId;
    const inputRole = roleId || role;
    if (inputRole !== undefined) {
      const resolved = await resolveRoleId(inputRole);
      if (!resolved) {
        return res.status(400).json({
          success: false,
          message: `Invalid role specified: ${inputRole}`
        });
      }
      updatedRoleId = resolved;
    }

    const updateQuery = `
      UPDATE User
      SET name = ?, email = ?, password = ?, avatar_image = ?, roleId = ?, isActive = ?, updatedAt = NOW(3)
      WHERE id = ?
    `;

    await pool.execute(updateQuery, [
      updatedName,
      updatedEmail,
      updatedPassword,
      updatedAvatar,
      updatedRoleId,
      updatedIsActive,
      id
    ] as any[]);

    const updatedUser = await findUserById(id);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser ? sanitizeUser(updatedUser) : null
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
