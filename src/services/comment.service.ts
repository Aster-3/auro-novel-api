import { getRepliesDto } from "../dtos/get.replies.dto.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { ICommentLikeRepository } from "../interfaces/comment.like.repo.interface.js";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";

export class CommentService implements ICommentService {
  constructor(
    private commentRepo: ICommentRepository,
    private replyRepo: IReplyRepository,
    private novelRepo?: INovelRepository,
    private commentLikeRepo?: ICommentLikeRepository,
  ) {}

  createComment = async (dto: CreateCommentDto) => {
    const novelExists = await this.novelRepo?.existControl({ id: dto.novelId });
    if (!novelExists) {
      throw new NotFoundError("Novel not found");
    }
    return await this.commentRepo.create(dto);
  };

  deleteComment = async (id: number) => {
    await this.commentRepo.delete(id);
  };

  getCommentsByNovelId = async (dto: GetCommentsDto, userId?: string) => {
    return await this.commentRepo.getCommentsByNovelId(dto, userId);
  };

  getTopCommentsOfLastWeek = async () => {
    return await this.commentRepo.getTopCommentsOfLastWeek();
  };

  getCommentReplies(dto: GetCommentRepliesDto) {
    return this.replyRepo.getCommentReplies(dto);
  }

  async toggleLike(userId: string, commentId: number) {
    return await this.commentLikeRepo?.toggleLike(userId, commentId)!;
  }

  getLast3CommentsByNovelId(novelId: string) {
    return this.commentRepo.getLast3CommentsByNovelId(novelId);
  }
}
