import { Request, Response } from "express";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { UserRoles } from "../constants/user.constants.js";
import { BadRequestError } from "../errors/bad.request.js";
import { IChapterService } from "../interfaces/chapter.service.interface.js";

export class NovelController {
  constructor(
    private novelService: INovelService,
    private commentService: ICommentService,
    private chapterService: IChapterService,
  ) {}

  createNovel = async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === UserRoles.ADMIN;
    const novel = await this.novelService.create(
      { ...req.body, authorId: req.user?.id },
      isAdmin,
      req.file,
    );
    res.status(201).json(novel);
  };

  getNovels = async (req: Request, res: Response) => {
    const novels = await this.novelService.getNovels(res.locals.validatedData);
    res.status(200).json(novels);
  };

  getOneNovel = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const novel = await this.novelService.getNovelDetailWithId(id);
    res.status(200).json(novel);
  };

  getNovelComments = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const comments = await this.commentService.getCommentsByNovelId(
      res.locals.validatedData,
      userId,
    );
    res.status(200).json(comments);
  };

  getMyComment = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(200).json(null);
    }
    const { novelId } = req.params as any;
    const comment = await this.commentService.getMyComment(novelId, userId);
    res.status(200).json(comment);
  };

  getLast3CommentsByNovelId = async (req: Request, res: Response) => {
    const { novelId } = req.params as any;
    const comments =
      await this.commentService.getLast3CommentsByNovelId(novelId);
    res.status(200).json(comments);
  };

  getLastUpdatedNovels = async (req: Request, res: Response) => {
    const { limit } = req.query as any;
    const novels = await this.novelService.getLastUpdatedNovels(
      limit ? parseInt(limit) : undefined,
    );
    res.status(200).json(novels);
  };

  getWeeklyTrendingNovels = async (req: Request, res: Response) => {
    const { limit } = req.query as any;
    const novels = await this.novelService.getWeeklyTrendingNovels(
      limit ? parseInt(limit) : undefined,
    );
    res.status(200).json(novels);
  };

  getRandomClassicNovels = async (req: Request, res: Response) => {
    const { limit } = req.query as any;
    const novels = await this.novelService.getRandomClassicNovels(
      limit ? parseInt(limit) : undefined,
    );
    res.status(200).json(novels);
  };

  getNovelsWithTagId = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const { limit } = req.query as any;
    const novels = await this.novelService.getNovelsWithTagId(
      id,
      limit ? parseInt(limit) : undefined,
    );
    res.status(200).json(novels);
  };

  getLastCreatedNovels = async (req: Request, res: Response) => {
    const { limit } = req.query as any;
    const novels = await this.novelService.getLastCreatedNovels(
      limit ? parseInt(limit) : undefined,
    );
    res.status(200).json(novels);
  };

  getSimilarNovels = async (req: Request, res: Response) => {
    const { id, limit } = res.locals.validatedData;
    const novels = await this.novelService.getSimilarNovels(id, limit);
    res.status(200).json({ items: novels });
  };

  addNovelComment = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const dto = { ...res.locals.validatedData, userId };

    const comment = await this.commentService.createComment(dto);
    res.status(201).json({ ...comment, userId });
  };

  updateNovelCategories = async (req: Request, res: Response) => {
    const { categories } = req.body;
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === UserRoles.ADMIN;
    const novel = await this.novelService.updateNovelCategories(
      id,
      categories,
      userId,
      isAdmin,
    );
    res.status(200).json({ novel });
  };

  updateNovelTags = async (req: Request, res: Response) => {
    const { tags } = req.body;
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === UserRoles.ADMIN;
    const novel = await this.novelService.updateNovelTags(
      id,
      tags,
      userId,
      isAdmin,
    );
    res.status(200).json({ novel });
  };

  incrementViewCount = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    await this.novelService.incrementViewCount(id);
    res.sendStatus(204);
  };

  updateNovel = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === UserRoles.ADMIN;
    const novel = await this.novelService.updateNovel({
      id,
      ...req.body,
      coverImage: req.file,
    }, userId, isAdmin);
    res.status(200).json({ novel });
  };

  getChaptersByNovelId = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === UserRoles.ADMIN;

    const chapters = await this.chapterService.getChaptersByNovelId(
      res.locals.validatedData,
      userId!,
      isAdmin,
    );
    res.json(chapters);
  };

  getNovelDownloadPackage = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const downloadPackage =
      await this.chapterService.getNovelDownloadPackage(id);
    res.status(200).json(downloadPackage);
  };

  getOfflineManifest = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const manifest = await this.chapterService.getOfflineManifest(id);
    res.status(200).json(manifest);
  };

  getOfflineChaptersPackage = async (req: Request, res: Response) => {
    const { id, chapterIds } = res.locals.validatedData;
    const downloadPackage =
      await this.chapterService.getOfflineChaptersPackage(id, chapterIds);
    res.status(200).json(downloadPackage);
  };

  getDraftChaptersByNovelId = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === UserRoles.ADMIN;

    const chapters = await this.chapterService.getDraftChaptersByNovelId(
      res.locals.validatedData,
      userId!,
      isAdmin,
    );

    res.json(chapters);
  };

  deleteNovel = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const userId = req.user?.id || "";
    const isAdmin = req.user?.role === UserRoles.ADMIN;
    await this.novelService.deleteNovel(id, userId, isAdmin);
    res.sendStatus(204);
  };
}
