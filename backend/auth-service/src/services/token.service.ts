import jwt from "jsonwebtoken";

const ACCESS_SECRET: jwt.Secret = process.env.JWT_ACCESS_SECRET || "markops_access_secret_super_secure_key_12345";
const REFRESH_SECRET: jwt.Secret = process.env.JWT_REFRESH_SECRET || "markops_refresh_secret_super_secure_key_67890";

const ACCESS_EXPIRES_IN = "1h";
const REFRESH_EXPIRES_IN = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions?: string[];
  [key: string]: any;
}

export function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: payload.userId, email: payload.email }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600 
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

