import { Request, Response } from "express";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";

export class NovelController {
  constructor(
    private novelService: INovelService,
    private commentService: ICommentService,
    private chapterRepository: IChapterRepository,
  ) {}

  createNovel = async (req: Request, res: Response) => {
    const novel = await this.novelService.create(req.body);
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
    const comments = await this.commentService.getCommentsByNovelId(
      res.locals.validatedData,
    );
    res.status(200).json(comments);
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
    console.log("Controller", req.body);
    console.log("Controller ID", id);
    const novel = await this.novelService.updateNovel({ id, ...req.body });
    res.status(200).json({ novel });
  };

  getChaptersByNovelId = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const chapters = await this.chapterRepository.getChapterByNovelId({
      id,
      ...res.locals.validatedData,
    });
    res.json(chapters);
  };

  getChaptersSummary = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const summary = await this.chapterRepository.getSummary(id);
    res.json(summary);
  };
}
