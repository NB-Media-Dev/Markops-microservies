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
    let userId = req.headers["x-user-id"] as string | undefined;
    let userRole = (req.headers["x-user-role"] || req.headers["x-role-code"]) as string | undefined;
    let userEmail = req.headers["x-user-email"] as string | undefined;
    let userName = req.headers["x-user-name"] as string | undefined;

    if (!userRole && req.headers.authorization) {
      try {
        const parts = String(req.headers.authorization).split(" ");
        if (parts.length === 2 && parts[1].includes(".")) {
          const payload = JSON.parse(Buffer.from(parts[1].split(".")[1], "base64").toString("utf-8"));
          if (payload) {
            userId = userId || String(payload.sub || payload.id);
            userRole = userRole || payload.role || payload.roleId;
            userEmail = userEmail || payload.email;
            userName = userName || payload.fullName || payload.name;
          }
        }
      } catch {}
    }

    if (!userRole && req.body) {
      userRole = req.body.creatorRole || req.body.userRole || req.body.role;
      userId = userId || (req.body.creatorId ? String(req.body.creatorId) : undefined);
      userName = userName || req.body.creatorName || req.body.name;
      userEmail = userEmail || req.body.creatorEmail || req.body.email;
    }

    (req as any).user = {
      id: userId ? (parseInt(userId, 10) || userId) : undefined,
      role: (userRole || "").toUpperCase(),
      email: userEmail || "",
      fullName: userName || ""
    };

    next();
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    const userRole = (user?.role || "").toUpperCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    const isAllowed =
      normalizedAllowed.includes(userRole) ||
      (normalizedAllowed.includes("ADMIN") && userRole === "ADMINISTRATOR") ||
      (normalizedAllowed.includes("ADMINISTRATOR") && userRole === "ADMIN");

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Only ${allowedRoles.join(" and ")} are permitted to perform this action. Current role: ${userRole || "UNKNOWN"}`
      });
      return;
    }
    next();
  };
}
