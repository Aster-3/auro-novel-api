import { Request, Response } from "express";
import { IChapterService } from "../interfaces/chapter.service.interface.js";

export class ChapterController {
  constructor(private chapterService: IChapterService) {}

  getOneChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const chapter = await this.chapterService.getOneChapter(id, userId);
    res.status(200).json(chapter);
  };

  createChapter = async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "admin";
    const authorId = req.user?.id || "";
    const result = await this.chapterService.create(
      req.body,
      isAdmin,
      authorId,
    );
    res.status(result ? 201 : 400).json({ success: result });
  };

  deleteChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    await this.chapterService.delete(id, userId);
    res.sendStatus(204);
  };

  updateChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === "admin";
    await this.chapterService.updateChapter(
      { ...req.body, id },
      userId,
      isAdmin,
    );
    res.sendStatus(204);
  };
}
