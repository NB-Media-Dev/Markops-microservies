import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: number | string;
  email: string;
  role: string;
  name?: string;
}

export function authenticateGatewayUser(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"];
  const userEmail = req.headers["x-user-email"];
  const userRole = req.headers["x-user-role"] || req.headers["x-role-code"];
  const userName = req.headers["x-user-name"];

  if (userId) {
    (req as any).user = {
      id: parseInt(String(userId), 10) || userId,
      email: String(userEmail || "user@markops.com"),
      role: String(userRole || "TELECALLER").toUpperCase(),
      name: String(userName || "Telecaller Agent")
    };
  } else {
    // Development fallback
    (req as any).user = {
      id: 6,
      email: "telecaller@markops.in",
      role: "TELECALLER",
      name: "Telecaller Agent"
    };
  }

  next();
}

