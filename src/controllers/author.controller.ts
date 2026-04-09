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

  getAuthorWallet = async (req: Request, res: Response) => {
    const { id } = req.user as any;
    const walletInfo = await this.authorService.getAuthorWallet(id);
    res.json(walletInfo);
  };

  getAuthorTransactions = async (req: Request, res: Response) => {
    const { id } = req.user as any;
    const transactions = await this.authorService.getAuthorTransactions(
      res.locals.validatedData,
      id,
    );
    res.json(transactions);
  };
}
