import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/validation.error.js";

export const validateSchema =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
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

    res.locals.validatedData = {
      ...result.data.query,
      ...result.data.params,
      ...result.data.body,
    };

    req.body = result.data.body;
    next();
  };
