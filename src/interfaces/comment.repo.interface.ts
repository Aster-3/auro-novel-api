import { FindAndCountType } from "../constants/findAndCountType.js";
import { Comment } from "../entities/Comment.js";

export interface ICommentRepository {
  getAllComments(page?: number, limit?: number): Promise<any[]>;
  getCommentsByUserId(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<any[]>;
  getCommentsByNovelId(
    novelId: string,
    page?: number,
    limit?: number,
  ): Promise<FindAndCountType<Comment>>;
}
