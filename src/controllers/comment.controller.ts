import { Request, Response } from "express";
import { ICommentService } from "../interfaces/comment.service.interface.js";

export class CommentController {
  constructor(private commentService: ICommentService) {}

  deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const userId = req.user?.id;
    await this.commentService.deleteComment(Number(commentId), userId);
    res.sendStatus(204);
  };

  getTopCommentsOfLastWeek = async (req: Request, res: Response) => {
    const comments = await this.commentService.getTopCommentsOfLastWeek();
    res.status(200).json(comments);
  };

  getCommentReplies = async (req: Request, res: Response) => {
    const data = { ...res.locals.validatedData, id: Number(req.params.id) };
    const userId = req.user?.id;
    if (userId) {
      data.userId = userId;
    }
    const replies = await this.commentService.getCommentReplies(data);
    res.status(200).json(replies);
  };

  toggleLike = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { id } = req.params as any;
    const liked = await this.commentService.toggleLike(userId, Number(id));
    res.status(200).json({ liked });
  };

  getOneCommentById = async (req: Request, res: Response) => {
    const { commentId } = req.params as any;
    const comment = await this.commentService.getOneCommentById(
      Number(commentId),
    );
    res.status(200).json(comment);
  };
}
