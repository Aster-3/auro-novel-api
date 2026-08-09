import { FindAndCountType } from "../constants/findAndCountType.js";
import { ChapterComment } from "../entities/ChapterComment.js";
import {
  CreateChapterCommentDto,
  CreateChapterCommentReplyDto,
} from "../schemas/create.chapter.comment.schema.js";
import { GetChapterCommentsDto } from "../schemas/get.chapter.comments.schema.js";

export interface IChapterCommentRepository {
  createRoot(
    dto: CreateChapterCommentDto & {
      userId: string;
      novelId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ): Promise<ChapterComment>;
  createReply(
    dto: CreateChapterCommentReplyDto & {
      userId: string;
      chapterId: string;
      novelId: string;
      rootCommentId: number;
      parentCommentId: number;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ): Promise<ChapterComment>;
  delete(id: number): Promise<string[]>;
  getRootComments(
    dto: GetChapterCommentsDto,
    userId?: string,
  ): Promise<FindAndCountType<ChapterComment>>;
  getReplies(
    dto: GetChapterCommentsDto & { rootCommentId: number },
    userId?: string,
  ): Promise<FindAndCountType<ChapterComment>>;
  getOneById(id: number, userId?: string): Promise<ChapterComment | null>;
  getMetaById(id: number): Promise<{
    id: number;
    userId: string;
    chapterId: string;
    novelId: string;
    rootCommentId: number | null;
    parentCommentId: number | null;
    deletedAt: Date | null;
  } | null>;
  isOwner(commentId: number, userId: string): Promise<boolean>;
}
