import { Request, Response } from "express";
import { ITagService } from "../interfaces/tag.service.interface.js";

export class TagController {
  constructor(private tagService: ITagService) {}

  createTag = async (req: Request, res: Response) => {
    await this.tagService.createTag(req.body);
    res.sendStatus(201);
  };

  deleteTag = async (req: Request, res: Response) => {
    const { id } = res.locals.validatedData;
    await this.tagService.deleteTag(id);
    res.sendStatus(204);
  };
}
