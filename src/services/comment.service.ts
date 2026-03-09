import { FindAndCountType } from "../constants/findAndCountType.js";
import { getRepliesDto } from "../dtos/get.replies.dto.js";
import { Comment } from "../entities/Comment.js";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";

export class CommentService implements ICommentService {
  constructor(private commentRepo: ICommentRepository) {}

  createComment = async (dto: CreateCommentDto | CreateReplyDto) => {
    return await this.commentRepo.create(dto);
  };

  deleteComment = async (id: number) => {
    return await this.commentRepo.delete(id);
  };

  getCommentsByNovelId = async ({
    novelId,
    page = 1,
    limit = 20,
  }: {
    novelId: string;
    page: number;
    limit: number;
  }) => {
    return await this.commentRepo.getCommentsByNovelId({
      novelId,
      page,
      limit,
    });
  };

  searchComments = async ({
    page = 1,
    limit = 20,
  }: {
    page: number;
    limit: number;
  }) => {
    return await this.commentRepo.searchComments({ page, limit });
  };

  async getCommentReplies({
    page = 1,
    limit = 20,
    commentId,
  }: {
    page: number;
    limit: number;
    commentId: number;
  }) {
    const result = await this.commentRepo.getCommentReplies({
      page,
      limit,
      commentId,
    });
    const formattedData = result.data.map(
      (reply) => new getRepliesDto(reply, commentId),
    );

    return {
      ...result,
      data: formattedData,
    };
  }
}
