import type { Request, Response, NextFunction } from "express";
import { login, register, refreshSession, logout, getCurrentUser } from "../services/auth.service.js";

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password, req.ip);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Invalid email or password" || error.message.includes("inactive"))
    ) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}



export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body;
    const tokens = await refreshSession(refreshToken, req.ip);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: tokens
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to refresh token"
    });
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await logout(refreshToken, req.ip);
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.headers["x-user-id"] as string) || "usr-admin-1";
    const profile = await getCurrentUser(userId);

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}
