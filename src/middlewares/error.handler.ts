import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app.error.js";
import { ValidationError } from "../errors/validation.error.js";
import { ConflictError } from "../errors/conflict.error.js";

export const GlobalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.message.includes("JSON")
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Gönderilen JSON formatı hatalı. Lütfen virgül ve parantezleri kontrol edin.",
      statusCode: 400,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(error.serialize());
  }

  console.error("### CRITIC ERROR ###", {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  return res.status(500).json({
    success: false,
    message:
      "Beklenmedik bir hata meydana geldi. Lütfen daha sonra tekrar deneyiniz.",
    statusCode: 500,
  });
};
