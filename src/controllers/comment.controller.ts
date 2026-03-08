import { Request, Response } from "express";
import { ICommentService } from "../interfaces/comment.service.interface.js";

export class CommentController {
  constructor(private commentService: ICommentService) {}

  getAllComments = async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    const comments = await this.commentService.getAllComments(page, limit);
    res.status(200).json({ comments });
  };

  getCommentsByUserId = async (req: Request, res: Response) => {
    const { id } = req.params as any;
    const { page, limit } = req.query as any;
    const comments = await this.commentService.getCommentsByUserId(
      id,
      page,
      limit,
    );
    res.status(200).json({ comments });
  };
}
