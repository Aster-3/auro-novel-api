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
      const formattedErrors = result.error.issues.map((issue: any) => {
        const fieldName = issue.path.length > 1 ? issue.path[1] : issue.path[0];
        return {
          field: String(fieldName),
          errors: [issue.message],
        };
      });
      return next(new ValidationError(formattedErrors));
    }

    res.locals.validatedData = {
      ...result.data.query,
      ...result.data.params,
      ...result.data.body,
    };

    req.body = result.data.body;
    next();
  };
