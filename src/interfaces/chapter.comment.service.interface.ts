import { FindAndCountType } from "../constants/findAndCountType.js";
import { ChapterComment } from "../entities/ChapterComment.js";
import {
  CreateChapterCommentDto,
  CreateChapterCommentReplyDto,
} from "../schemas/create.chapter.comment.schema.js";
import { GetChapterCommentsDto } from "../schemas/get.chapter.comments.schema.js";

export interface IChapterCommentService {
  createComment(
    dto: CreateChapterCommentDto & {
      userId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ): Promise<ChapterComment>;
  createReply(
    dto: CreateChapterCommentReplyDto & {
      rootCommentId: number;
      userId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ): Promise<ChapterComment>;
  deleteComment(commentId: number, userId: string): Promise<void>;
  getCommentsByChapterId(
    dto: GetChapterCommentsDto,
    userId?: string,
  ): Promise<FindAndCountType<ChapterComment>>;
  getRepliesByCommentId(
    dto: GetChapterCommentsDto & { rootCommentId: number },
    userId?: string,
  ): Promise<FindAndCountType<ChapterComment>>;
  getOneCommentById(id: number, userId?: string): Promise<ChapterComment | null>;
  toggleLike(userId: string, commentId: number): Promise<boolean>;
}
