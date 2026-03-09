import { FindAndCountType } from "../constants/findAndCountType.js";
import { getRepliesDto } from "../dtos/get.replies.dto.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";

export interface ICommentService {
  getCommentsByNovelId(query: {
    novelId: string;
    page?: number;
    limit?: number;
  }): Promise<FindAndCountType<Comment>>;

  createComment(dto: CreateCommentDto): Promise<Comment | null>;
  deleteComment(id: number): Promise<void>;
  searchComments(query: {
    page?: number;
    limit?: number;
  }): Promise<FindAndCountType<Comment>>;
  getCommentReplies(query: {
    page: number;
    limit: number;
    commentId: number;
  }): Promise<FindAndCountType<getRepliesDto>>;
  getRecommendationRate(
    novelId: number,
  ): Promise<{ rate: number; count: number } | null>;
}
