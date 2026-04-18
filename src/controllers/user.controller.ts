import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service.interface.js";
import { uploadToS3 } from "../services/s3.service.js";
import { ILibraryService } from "../interfaces/library.service.interface.js";

export class UserController {
  constructor(
    private userService: IUserService,
    private libraryService: ILibraryService,
  ) {}

  getOneUser = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const user = await this.userService.getOneUser(id);
    res.status(200).json(user);
  };

  deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    await this.userService.deleteUser(id);
    res.status(204).send();
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

    if (files.profileImageUrl) {
      const profileImageUrl = await uploadToS3(
        files.profileImageUrl[0],
        "avatars",
      );
      updateData.profileImageUrl = profileImageUrl;
    }

    if (files.profileBackgroundImageUrl) {
      const profileBackgroundImageUrl = await uploadToS3(
        files.profileBackgroundImageUrl[0],
        "covers",
      );

      updateData.profileBackgroundImageUrl = profileBackgroundImageUrl;
    }

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

  getUserBalance = async (req: Request, res: Response) => {
    const id = req.user?.id!;
    const balance = await this.userService.getUserBalance(id);
    res.status(200).json(balance);
  };

  toggleNovelInLibrary = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { novelId } = req.body as any;
    await this.libraryService.toggleNovelInLibrary(novelId, userId);
    res.status(200).json({ message: "Novel toggled in library" });
  };

  getMyLibrary = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const library = await this.libraryService.getMyLibrary({
      userId,
      ...res.locals.validatedData,
    });
    res.status(200).json(library);
  };

  isNovelInLibrary = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { novelId } = req.params as any;
    const exists = await this.libraryService.isNovelInLibrary(novelId, userId);
    res.status(200).json({ exists });
  };
}
