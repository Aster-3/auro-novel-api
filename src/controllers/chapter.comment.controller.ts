import { Request, Response } from "express";
import { IChapterCommentService } from "../interfaces/chapter.comment.service.interface.js";
import { deleteFromS3ByUrl, uploadImageToS3 } from "../services/s3.service.js";

export class ChapterCommentController {
  constructor(private chapterCommentService: IChapterCommentService) {}

  getCommentsByChapterId = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const comments = await this.chapterCommentService.getCommentsByChapterId(
      res.locals.validatedData,
      userId,
    );
    res.status(200).json(comments);
  };

  createComment = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const image = req.file
      ? await uploadImageToS3(req.file, "chaptercomments", "comment-attachment")
      : null;
    try {
      const comment = await this.chapterCommentService.createComment({
        ...res.locals.validatedData,
        userId,
        imageUrl: image?.url ?? null,
        imageWidth: image?.width ?? null,
        imageHeight: image?.height ?? null,
      });
      res.status(201).json(comment);
    } catch (error) {
      await deleteFromS3ByUrl(image?.url);
      throw error;
    }
  };

  getRepliesByCommentId = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const replies = await this.chapterCommentService.getRepliesByCommentId(
      {
        ...res.locals.validatedData,
        rootCommentId: Number(req.params.commentId),
      },
      userId,
    );
    res.status(200).json(replies);
  };

  createReply = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const image = req.file
      ? await uploadImageToS3(req.file, "chaptercomments", "comment-attachment")
      : null;
    try {
      const reply = await this.chapterCommentService.createReply({
        ...res.locals.validatedData,
        rootCommentId: Number(req.params.commentId),
        userId,
        imageUrl: image?.url ?? null,
        imageWidth: image?.width ?? null,
        imageHeight: image?.height ?? null,
      });
      res.status(201).json(reply);
    } catch (error) {
      await deleteFromS3ByUrl(image?.url);
      throw error;
    }
  };

  getOneCommentById = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const comment = await this.chapterCommentService.getOneCommentById(
      Number(req.params.commentId),
      userId,
    );
    res.status(200).json(comment);
  };

  deleteComment = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    await this.chapterCommentService.deleteComment(
      Number(req.params.commentId),
      userId,
    );
    res.sendStatus(204);
  };

  toggleLike = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const liked = await this.chapterCommentService.toggleLike(
      userId,
      Number(req.params.commentId),
    );
    res.status(200).json({ liked });
  };
}
