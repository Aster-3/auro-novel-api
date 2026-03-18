import * as jwt from "jsonwebtoken";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { getEnv } from "../utils/getEnv.js";

export class TokenService {
  private static readonly accessSecret = getEnv("JWT_ACCESS_SECRET");
  private static readonly refreshSecret = getEnv("JWT_REFRESH_SECRET");

  generateAccessToken(payload: object): string {
    return jwt.default.sign(payload, TokenService.accessSecret, {
      expiresIn: "15m",
    });
  }

  generateRefreshToken(payload: object): string {
    return jwt.default.sign(payload, TokenService.refreshSecret, {
      expiresIn: "7d",
    });
  }

  verifyAccessToken(token: string) {
    return jwt.default.verify(token, TokenService.accessSecret);
  }

  verifyRefreshToken(token: string) {
    return jwt.default.verify(token, TokenService.refreshSecret);
  }
}

export const tokenService = new TokenService();
