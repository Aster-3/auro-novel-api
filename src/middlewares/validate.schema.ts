import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../errors/validation.error.js";

export const validateSchema =
  (schema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // Hataları alan adlarına göre gruplayalım
      const errors: Record<string, string[]> = {};

      result.error.issues.forEach((issue: any) => {
        const fieldName = String(
          issue.path.length > 1 ? issue.path[1] : issue.path[0],
        );

        if (!errors[fieldName]) {
          errors[fieldName] = [];
        }
        errors[fieldName].push(issue.message);
      });

      // ValidationError'a doğrudan bu nesneyi gönderiyoruz
      return next(new ValidationError({ errors }));
    }

    const validated = result.data as {
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
    };

    res.locals.validatedData = {
      ...validated.query,
      ...validated.params,
      ...validated.body,
    };

    req.body = validated.body;
    next();
  };
