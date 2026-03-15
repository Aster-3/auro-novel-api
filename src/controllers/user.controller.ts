import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";

export class UserController {
  constructor(private userService: IUserService) {}

  getOneUser = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const user = await this.userService.getOneUser(id);
    res.status(200).json(user);
  };

  getUsers = async (req: Request, res: Response) => {
    const users = await this.userService.searchUsers(res.locals.validatedData);
    res.status(200).json(users);
  };

  getAllVerifications = async (req: Request, res: Response) => {
    const verifications = await this.userService.getAllVerifications();
    res.status(200).json(verifications);
  };
}
