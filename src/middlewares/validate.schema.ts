import { ZodObject } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/validation.error.js";

export const validateSchema =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    console.log(result);
    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => {
        const fieldName = issue.path.length > 1 ? issue.path[1] : issue.path[0];
        return {
          field: String(fieldName),
          errors: [issue.message],
        };
      });
      return next(new ValidationError(formattedErrors));
    }

    if (result.data.body) {
      Object.assign(req.body, result.data.body);
    }

    if (result.data.params) {
      Object.assign(req.params, result.data.params);
    }

    if (result.data.query) {
      Object.assign(req.query, result.data.query);
    }
    next();
  };
