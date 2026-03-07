import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";
import { plainToInstance } from "class-transformer";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { validate } from "class-validator";

export class AuthController {
  constructor(private userService: IUserService) {}

  register = async (req: Request, res: Response) => {
    const userDto = plainToInstance(CreateUserDto, req.body, {
      excludeExtraneousValues: false,
    });
    const errors = await validate(userDto, {
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const simplifiedErrors = errors.map((err) => ({
        field: err.property,
        errors: Object.values(err.constraints || {}),
      }));
      return res.json({ success: false, errors: simplifiedErrors });
    }
    const created = await this.userService.create(userDto);
    res.json({ user: created });
  };

  login = (req: Request, res: Response) => {};
}
