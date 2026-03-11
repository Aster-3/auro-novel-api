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
    const { id } = req.params as any;
    console.log("ID:", id);
    console.log("Query:", res.locals.validatedData);
    const replies = await this.commentService.getCommentReplies({
      id,
      ...res.locals.validatedData,
    });
    res.status(200).json(replies);
  };

  toggleLike = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = res.locals.validatedData.userId;
    console.log("Toggling like for comment ID:", id, "by user ID:", userId);
    const liked = await this.commentService.toggleLike(userId, Number(id));
    res.status(200).json({ liked });
  };
}
