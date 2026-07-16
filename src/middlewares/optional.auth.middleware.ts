import { NextFunction, Request, Response } from "express";
import { tokenService } from "../services/token.service.js";

export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) return next();

    try {
      const decoded = tokenService.verifyAccessToken(token);
      req.user = decoded as Request["user"];
    } catch (error) {
      console.log("Optional token invalid, continuing as guest.");
    }

    next();
  } catch (error) {
    next();
  }
};
