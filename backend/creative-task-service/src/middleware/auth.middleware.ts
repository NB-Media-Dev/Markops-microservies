import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";
import type { DbPoolWrapper } from "../config/db.js";

export interface AuthenticatedUser {
  id: number | string;
  role: string;
  email: string;
  fullName: string;
}

export function authenticateJwt(_dbPool?: DbPoolWrapper) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Check Authorization header or cookies
    const authHeader = req.headers.authorization || (req.headers as any).Authorization;
    let token: string | null = null;

    if (authHeader && typeof authHeader === "string") {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    } else if (req.cookies && (req.cookies as any).token) {
      token = (req.cookies as any).token;
    }

    // Dev bypass / header override
    const devUserId = req.headers["x-user-id"] as string | undefined;
    const devUserRole = (req.headers["x-user-role"] || req.headers["x-role-code"]) as string | undefined;
    const devUserEmail = req.headers["x-user-email"] as string | undefined;
    const devUserName = req.headers["x-user-name"] as string | undefined;

    if (devUserId || devUserRole) {
      (req as any).user = {
        id: devUserId ? parseInt(devUserId, 10) || devUserId : 2,
        role: (devUserRole || "DESIGNER").toUpperCase(),
        email: devUserEmail || "designer@markops.io",
        fullName: devUserName || "Creative Designer"
      };
      return next();
    }

    if (!token) {
      // Default to guest designer for local demo convenience
      (req as any).user = {
        id: 2,
        role: "DESIGNER",
        email: "designer@markops.io",
        fullName: "Creative Designer"
      };
      return next();
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      (req as any).user = {
        id: decoded.id || decoded.userId || 2,
        role: (decoded.role || "DESIGNER").toUpperCase(),
        email: decoded.email || "designer@markops.io",
        fullName: decoded.fullName || decoded.name || "Creative Designer"
      };
      return next();
    } catch {
      // If token is mock dev token (e.g. mo_jwt_default, mo_jwt_designer_microservice)
      if (typeof token === "string" && (token.includes("designer") || token.includes("mo_jwt"))) {
        (req as any).user = {
          id: 2,
          role: "DESIGNER",
          email: "designer@markops.io",
          fullName: "Creative Designer"
        };
        return next();
      }

      (req as any).user = {
        id: 2,
        role: "DESIGNER",
        email: "designer@markops.io",
        fullName: "Creative Designer"
      };
      return next();
    }
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

