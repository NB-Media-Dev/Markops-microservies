import { findUserByEmail, findUserById, createUser, sanitizeUser } from "../controllers/users.controller.js";
import { comparePassword, hashPassword } from "./password.service.js";
import { generateTokens, verifyRefreshToken } from "./token.service.js";
import { logAudit } from "./audit.service.js";

export interface RefreshTokenRecord {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

// In-memory active refresh tokens store
const activeRefreshTokens = new Map<string, RefreshTokenRecord>();

export async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  activeRefreshTokens.set(token, {
    token,
    userId,
    expiresAt,
    createdAt: new Date().toISOString()
  });
}

export async function findRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
  const record = activeRefreshTokens.get(token);
  if (!record) return null;

  if (new Date(record.expiresAt) < new Date()) {
    activeRefreshTokens.delete(token);
    return null;
  }

  return { ...record };
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  return activeRefreshTokens.delete(token);
}

export async function login(email: string, password: string, ip?: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    await logAudit("LOGIN_FAILED", undefined, { reason: "User not found", email }, ip);
    throw new Error("Invalid email or password");
  }

  const userIdStr = String(user.id);

  if (!user.isActive) {
    await logAudit("LOGIN_BLOCKED", userIdStr, { reason: "User account disabled", email }, ip);
    throw new Error("User account is inactive. Please contact your administrator.");
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    await logAudit("LOGIN_FAILED", userIdStr, { reason: "Invalid password", email }, ip);
    throw new Error("Invalid email or password");
  }

  const tokens = generateTokens({
    userId: userIdStr,
    email: user.email,
    role: user.roleId
  });

  await saveRefreshToken(userIdStr, tokens.refreshToken);
  await logAudit("LOGIN_SUCCESS", userIdStr, { email: user.email, role: user.roleId }, ip);

  return {
    user: sanitizeUser(user),
    role: user.roleId,
    tokens
  };
}

export async function register(
  data: { name: string; email: string; password: string; roleId?: string },
  ip?: string
) {
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await hashPassword(data.password);
  const newUser = await createUser({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.roleId || "TELECALLER"
  });

  const newUserIdStr = String(newUser.id);

  const tokens = generateTokens({
    userId: newUserIdStr,
    email: newUser.email,
    role: newUser.roleId
  });

  await saveRefreshToken(newUserIdStr, tokens.refreshToken);
  await logAudit("USER_REGISTERED", newUserIdStr, { email: newUser.email, role: newUser.roleId }, ip);

  return {
    user: sanitizeUser(newUser),
    role: newUser.roleId,
    tokens
  };
}

export async function refreshSession(refreshToken: string, ip?: string) {
  let decoded: { userId: string; email: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }

  const storedToken = await findRefreshToken(refreshToken);
  if (!storedToken || storedToken.userId !== decoded.userId) {
    throw new Error("Refresh token has been revoked or is invalid");
  }

  const user = await findUserById(decoded.userId);
  if (!user || !user.isActive) {
    throw new Error("User account is inactive or no longer exists");
  }

  const userIdStr = String(user.id);

  await revokeRefreshToken(refreshToken);

  const tokens = generateTokens({
    userId: userIdStr,
    email: user.email,
    role: user.roleId
  });

  await saveRefreshToken(userIdStr, tokens.refreshToken);
  await logAudit("TOKEN_REFRESHED", userIdStr, undefined, ip);

  return tokens;
}

export async function logout(refreshToken: string, ip?: string) {
  const storedToken = await findRefreshToken(refreshToken);
  if (storedToken) {
    await revokeRefreshToken(refreshToken);
    await logAudit("LOGOUT", storedToken.userId, undefined, ip);
  }
  return true;
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return {
    user: sanitizeUser(user),
    role: user.roleId
  };
}
