import type { Request, Response, NextFunction } from "express";
import type { DbPoolWrapper } from "../config/db.js";

export interface AuthenticatedUser {
  id: number | string;
  role: string;
  email: string;
  fullName: string;
}

/**
 * Extracts authenticated user context forwarded by the API Gateway.
 * The API Gateway validates JWT tokens and forwards x-user-* headers.
 */
export function authenticateJwt(_dbPool?: DbPoolWrapper) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userId = req.headers["x-user-id"] as string | undefined;
    const userRole = (req.headers["x-user-role"] || req.headers["x-role-code"]) as string | undefined;
    const userEmail = req.headers["x-user-email"] as string | undefined;
    const userName = req.headers["x-user-name"] as string | undefined;

    (req as any).user = {
      id: userId ? (parseInt(userId, 10) || userId) : 2,
      role: (userRole || "DESIGNER").toUpperCase(),
      email: userEmail || "designer@markops.io",
      fullName: userName || "Creative Designer"
    };

    next();
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (!user) {
      res.status(401).json({ error: "Unauthorized: Authentication required" });
      return;
    }
    const userRole = (user.role || "").toUpperCase();
    if (!allowedRoles.map((r) => r.toUpperCase()).includes(userRole)) {
      res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Current role: ${userRole}`
      });
      return;
    }
    next();
  };
}
