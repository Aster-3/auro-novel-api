import { Request, Response } from "express";
import { ICommentService } from "../interfaces/comment.service.interface.js";

export class CommentController {
  constructor(private commentService: ICommentService) {}

  deleteComment = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.commentService.deleteComment(Number(id));
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
    console.log("Toggling like for comment ID:", id, "by user ID:", userId);
    const liked = await this.commentService.toggleLike(userId, Number(id));
    res.status(200).json({ liked });
  };
}
