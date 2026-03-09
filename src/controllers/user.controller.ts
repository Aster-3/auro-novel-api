import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";
import { getAllUserSchema } from "../schemas/queryPageAndLimitSchema.js";
import { validateSchema } from "../middlewares/validate.schema.js";

export class UserController {
  constructor(private userService: IUserService) {}

  getAllUsers = async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    const users = await this.userService.getAllUsers(page, limit);
    res.status(200).json({ users });
  };

  getOneUser = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const user = await this.userService.getOneUser(id);
    res.status(200).json({ user });
  };

  searchUsers = async (req: Request, res: Response) => {
    const { query, page } = req.query as any;
    console.log(query, page);
    const users = await this.userService.searchUsers(query, page);
    res.status(200).json({ users });
  };
}
