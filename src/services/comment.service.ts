import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";

export class CommentService implements ICommentService {
  constructor(private commentRepo: ICommentRepository) {}

  createComment = async (dto: CreateCommentDto) => {
    return await this.commentRepo.create(dto);
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
}
