import { Request, Response } from "express";
import { IAuthorService } from "../interfaces/author.service.interface.js";

export class AuthorController {
  constructor(private authorService: IAuthorService) {}

  createAuthor = async (req: Request, res: Response) => {
    const dto = req.body;
    await this.authorService.createAuthor(dto);
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
}
