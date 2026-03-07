import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";
import { getAllUserSchema } from "../schemas/get.all.user.schema.js";
import { validateSchema } from "../middlewares/validate.schema.js";

export class UserController {
  constructor(private userService: IUserService) {}

  getAllUsers = async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    const users = await this.userService.getAllUsers(page, limit);
    res.status(200).json({ users });
  };

  getOneUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing required fields" });
    if (typeof id !== "string")
      return res.status(400).json({ error: "Missing required fields" });
    const user = await this.userService.getOneUser(id);
    res.status(200).json({ user });
  };
}
