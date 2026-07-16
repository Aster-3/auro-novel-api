import { NextFunction, Request, Response } from "express";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { tokenService } from "../services/token.service.js";

export const authMiddleware = (
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

    if (!token) {
      throw new UnauthenticatedError("ACCESS_TOKEN_INVALID");
    }

    let decoded;

    try {
      decoded = tokenService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthenticatedError("ACCESS_TOKEN_INVALID");
    }

    req.user = decoded as Request["user"];

    next();
  } catch (error) {
    next(error);
  }
};
