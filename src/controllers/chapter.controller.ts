import { Request, Response } from "express";
import { IChapterService } from "../interfaces/chapter.service.interface.js";

export class ChapterController {
  constructor(private chapterService: IChapterService) {}

  createChapter = async (req: Request, res: Response) => {
    const result = await this.chapterService.create(req.body);
    res.status(result ? 201 : 400).json({ success: result });
  };

  deleteChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    await this.chapterService.delete(id);
    res.sendStatus(204);
  };

  updateChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    console.log("Locals:", res.locals.validatedData);
    console.log("Body:", req.body);
    await this.chapterService.updateChapter({ ...req.body, id });
    res.sendStatus(204);
  };
}
