import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";

export class AuthController {
  constructor(private userService: IUserService) {}

  register = async (req: Request, res: Response) => {
    const created = await this.userService.create(req.body);
    res.json({ user: created });
  };

  verifyUser = async (req: Request, res: Response) => {
    const user = await this.userService.verifyUser(req.body);
    res.json({ user });
  };

  resendVerificationCode = async (req: Request, res: Response) => {
    const result = await this.userService.resendCode(req.body.email);
    res.json(result);
  };

  login = async (req: Request, res: Response) => {
    const data = await this.userService.login(req.body);
    res.json(data);
  };

  refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const data = await this.userService.refreshToken(refreshToken);
    res.json(data);
  };
}
