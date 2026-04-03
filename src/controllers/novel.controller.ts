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
    let data = req.body;
    const user = req.user;

    if (user?.role !== UserRoles.ADMIN) {
      if (!user?.id) {
        return res.status(403).json({ message: "Yazar ID'si bulunamadı." });
      }
      data = { ...data, authorId: user?.id };
    } else {
      if (!data.authorId) {
        throw new BadRequestError("Admin için yazar ID'si gereklidir.");
      }
    }
    const novel = await this.novelService.create(data, req.file);
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

  addNovelComment = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const dto = { ...res.locals.validatedData, userId };

    const comment = await this.commentService.createComment(dto);
    res.status(201).json({ ...comment, userId });
  };

  updateNovelCategories = async (req: Request, res: Response) => {
    const { categories } = req.body;
    const { id } = req.params as any;
    const novel = await this.novelService.updateNovelCategories(id, categories);
    res.status(200).json({ novel });
  };

  updateNovelTags = async (req: Request, res: Response) => {
    const { tags } = req.body;
    const { id } = req.params as any;
    const novel = await this.novelService.updateNovelTags(id, tags);
    res.status(200).json({ novel });
  };

  incrementViewCount = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    await this.novelService.incrementViewCount(id);
    res.sendStatus(204);
  };

  updateNovel = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const novel = await this.novelService.updateNovel({
      id,
      ...req.body,
      coverImage: req.file,
    });
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
    await this.novelService.deleteNovel(id);
    res.sendStatus(204);
  };
}
