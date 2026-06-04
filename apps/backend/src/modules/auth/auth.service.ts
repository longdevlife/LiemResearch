import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthResponse, AuthTokens, User } from "@trend/shared-types";
import { env } from "../../config/env.js";
import { AppError } from "../../common/exceptions/app-error.js";
import type { AuthClaims } from "../../common/middleware/auth.js";
import { RefreshTokenModel, UserModel, type UserDoc } from "./models/user.model.js";
import type { LoginInput, RegisterInput } from "./dto/auth.schema.js";

const BCRYPT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await UserModel.findOne({ email: input.email }).lean();
    if (existing) throw AppError.conflict("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await UserModel.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role ?? "student",
    });

    const tokens = await issueTokens(user);
    return { user: toUserDto(user), tokens };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email: input.email });
    if (!user) throw AppError.unauthorized("Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw AppError.unauthorized("Invalid credentials");

    const tokens = await issueTokens(user);
    return { user: toUserDto(user), tokens };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const stored = await RefreshTokenModel.findOne({ tokenHash });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    let payload: AuthClaims;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthClaims;
    } catch {
      throw AppError.unauthorized("Invalid refresh token");
    }

    const user = await UserModel.findById(payload.sub);
    if (!user) throw AppError.unauthorized();

    // Rotate: revoke old, issue new pair.
    stored.revokedAt = new Date();
    await stored.save();
    return issueTokens(user);
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await RefreshTokenModel.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  },

  async me(userId: string): Promise<User> {
    const user = await UserModel.findById(userId);
    if (!user) throw AppError.unauthorized();
    return toUserDto(user);
  },
};

async function issueTokens(user: UserDoc): Promise<AuthTokens> {
  const claims: AuthClaims = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
  const refreshToken = jwt.sign(claims, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);

  const decoded = jwt.decode(refreshToken) as { exp: number };
  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
  });

  const accessDecoded = jwt.decode(accessToken) as { exp: number };
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: new Date(accessDecoded.exp * 1000).toISOString(),
  };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toUserDto(user: UserDoc): User {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl ?? undefined,
    institution: user.institution ?? undefined,
    researchInterests: user.researchInterests,
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
    updatedAt: (user as unknown as { updatedAt: Date }).updatedAt.toISOString(),
  };
}
