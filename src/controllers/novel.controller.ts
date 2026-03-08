import { Request, Response } from "express";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { NotFoundError } from "../errors/not.found.error.js";

export class NovelController {
  constructor(
    private novelService: INovelService,
    private commentService: ICommentService,
  ) {}

  createNovel = async (req: Request, res: Response) => {
    const novel = await this.novelService.create(req.body);
    res.status(201).json({ novel });
  };

  getAllNovels = async (req: Request, res: Response) => {
    const { name, status, page, limit } = req.query as any;
    const novels = await this.novelService.findAll({
      filter: { status, name },
      page,
      limit,
    });
    res.status(200).json({ novels });
  };

  getOneNovel = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const novel = await this.novelService.findOneBy({ id });
    if (!novel) throw new NotFoundError("Aradığınız novel bulunamadı.");
    res.status(200).json({ novel });
  };

  getNovelComments = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const comments = await this.commentService.getCommentsByNovelId({
      novelId: id,
      page: 1,
      limit: 10,
    });
    res.status(200).json({ comments });
  };

  addNovelComment = async (req: Request, res: Response) => {
    const { novelId } = req.body;
    const novelIsAvailable = await this.novelService.findOneBy({ id: novelId });
    if (!novelIsAvailable)
      throw new NotFoundError("Yorum yapmak istediğiniz roman bulunamadı.");

    const comment = await this.commentService.createComment(req.body);
    res.status(201).json({ comment });
  };
}
