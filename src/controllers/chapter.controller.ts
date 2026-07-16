import { Request, Response } from "express";
import { IChapterService } from "../interfaces/chapter.service.interface.js";

export class ChapterController {
  constructor(private chapterService: IChapterService) {}

  getOneChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || null!;
    const isAdmin = req.user?.role === "admin";
    const chapter = await this.chapterService.getChapterForReading(
      id,
      userId,
      isAdmin,
    );
    res.status(200).json(chapter);
  };

  getOneOfflineChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const chapter = await this.chapterService.getChapterOfflinePackage(id);
    res.status(200).json(chapter);
  };

  getOneDraftChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === "admin";
    const chapter = await this.chapterService.getOneDraftChapter(
      id,
      userId,
      isAdmin,
    );

    res.status(200).json(chapter);
  };

  createChapter = async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "admin";
    const authorId = req.user?.id || "";
    await this.chapterService.createChapter(req.body, authorId, isAdmin);
    res.status(201).json();
  };

  publishChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const isAdmin = req.user?.role === "admin";
    const authorId = req.user?.id || "";
    await this.chapterService.publishChapter(
      { ...req.body, id: id },
      authorId,
      isAdmin,
    );
    res.status(201).json();
  };

  deleteChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === "admin";
    await this.chapterService.deleteChapter(id, userId, isAdmin);
    res.sendStatus(204);
  };

  updateChapter = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === "admin";
    await this.chapterService.updateChapter(
      { ...req.body, id: id },
      userId,
      isAdmin,
    );
    res.sendStatus(204);
  };

  changePublicationStatus = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const { publicationStatus } = req.body;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === "admin";
    await this.chapterService.changePublicationStatus({
      chapterId: id,
      publicationStatus,
      authorId: userId,
      isAdmin,
    });
    res.sendStatus(204);
  };

}
