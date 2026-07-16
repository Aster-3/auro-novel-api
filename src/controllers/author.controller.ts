import { Request, Response } from "express";
import { IAuthorService } from "../interfaces/author.service.interface.js";

export class AuthorController {
  constructor(private authorService: IAuthorService) {}

  createAuthor = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    await this.authorService.createAuthor({ ...req.body, userId }, isAdmin);
    res.sendStatus(201);
  };

  deleteAuthor = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    await this.authorService.deleteAuthor(id);
    res.sendStatus(204);
  };

  getAuthors = async (req: Request, res: Response) => {
    const result = await this.authorService.getAuthors(
      res.locals.validatedData,
    );
    res.json(result);
  };

  getMe = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const result = await this.authorService.getAuthorStatus(userId);
    res.status(200).json(result);
  };

  getMyNovels = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const result = await this.authorService.getMyNovels(
      userId,
      res.locals.validatedData,
    );
    res.status(200).json(result);
  };
}
