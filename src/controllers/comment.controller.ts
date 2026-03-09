import { Request, Response } from "express";
import { ICommentService } from "../interfaces/comment.service.interface.js";

export class CommentController {
  constructor(private commentService: ICommentService) {}

  deleteComment = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.commentService.deleteComment(+id);
    res.sendStatus(204);
  };

  searchComments = async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    const comments = await this.commentService.searchComments({ page, limit });
    res.status(200).json({ comments });
  };

  getCommentReplies = async (req: Request, res: Response) => {
    const { page, limit, commentId } = req.query as any;
    const comments = await this.commentService.getCommentReplies({
      page,
      limit,
      commentId,
    });
    res.status(200).json({ comments });
  };
}
