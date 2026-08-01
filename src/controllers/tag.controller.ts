import { Request, Response } from "express";
import { ITagService } from "../interfaces/tag.service.interface.js";
import { canShowAdultContent } from "../utils/adult.content.visibility.js";

export class TagController {
  constructor(private tagService: ITagService) {}

  createTag = async (req: Request, res: Response) => {
    await this.tagService.createTag({ ...req.body, userId: req.user?.id });
    res.status(201).json({ message: "Etiket basariyla olusturuldu." });
  };

  deleteTag = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    await this.tagService.deleteTag(id);
    res.sendStatus(204);
  };

  searchTags = async (req: Request, res: Response) => {
    const tags = await this.tagService.searchTags(res.locals.validatedData);
    res.json(tags);
  };

  getRandomTags = async (req: Request, res: Response) => {
    const { limit } = req.query as any;
    const tags = await this.tagService.getRandomTags(Number(limit) || 10);
    res.json(tags);
  };

  getNovelsByTagId = async (req: Request, res: Response) => {
    const novels = await this.tagService.getNovelsByTagId(
      res.locals.validatedData,
      canShowAdultContent(req.user),
    );
    res.json(novels);
  };
}
