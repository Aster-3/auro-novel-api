import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";
import { fi } from "zod/locales";
import { uploadToS3 } from "../services/s3.service.js";

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

  updateUser = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const updateData = { ...req.body, id: req.user?.id };

    if (files.profileImgUrl) {
      const profileImgUrl = await uploadToS3(files.profileImgUrl[0], "avatars");
      updateData.profileImageUrl = profileImgUrl;
    }

    if (files.profileBackgroundImgUrl) {
      const profileBackgroundImgUrl = await uploadToS3(
        files.profileBackgroundImgUrl[0],
        "covers",
      );
      updateData.profileBackgroundImageUrl = profileBackgroundImgUrl;
    }
    console.log("Controller updateData:", updateData);
    const updatedUser = await this.userService.updateUser(updateData);
    res.status(200).json(updatedUser);
  };

  getMe = async (req: Request, res: Response) => {
    const user = await this.userService.getMe({
      userId: req.user?.id!,
      fields: res.locals.validatedData.fields,
    });
    res.status(200).json(user);
  };
}
