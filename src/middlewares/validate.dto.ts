import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { classValidatorErrorMapper } from "../utils/class.validator.error.mapper.js";
import { ValidationError } from "../errors/validation.error.js";

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const instance = plainToInstance(dtoClass, req.body);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    });

    if (errors.length > 0) {
      const simplifiedErrors: any = classValidatorErrorMapper(errors);
      return next(new ValidationError(simplifiedErrors));
    }

    req.body = instance;
    next();
  };
};
