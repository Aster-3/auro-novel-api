import { NextFunction, Request, Response } from "express";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js"; // 403 Hatası için
import { tokenService } from "../services/token.service.js";
import { UserRoles } from "../constants/user.constants.js";

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthenticatedError("ACCESS_TOKEN_INVALID");
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = tokenService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthenticatedError("ACCESS_TOKEN_INVALID");
    }

    if (decoded.role !== UserRoles.ADMIN) {
      throw new ForbiddenError("Yetkisiz erişim. Admin rolü gereklidir.");
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
