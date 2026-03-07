import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";

export class AuthController {
  constructor(private userService: IUserService) {}

  register = async (req: Request, res: Response) => {
    const created = await this.userService.create(req.body);
    res.json({ user: created });
  };

  login = (req: Request, res: Response) => {};
}
