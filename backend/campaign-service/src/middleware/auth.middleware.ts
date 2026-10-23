import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  name?: string;
}

export function authenticateGatewayUser(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"];
  const userEmail = req.headers["x-user-email"];
  const userRole = req.headers["x-user-role"];
  const userName = req.headers["x-user-name"];

  if (userId) {
    (req as any).user = {
      id: parseInt(String(userId), 10) || 1,
      email: String(userEmail || "user@markops.com"),
      role: String(userRole || "ADMIN"),
      name: String(userName || "User")
    };
  } else {
    // Development fallback
    (req as any).user = {
      id: 1,
      email: "admin@markops.com",
      role: "ADMIN",
      name: "Admin User"
    };
  }

  next();
}

