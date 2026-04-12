import { Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { Novel } from "../entities/_index.js";
import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
export class CommentRepository implements ICommentRepository {
  constructor(private commentRepo: Repository<Comment>) {}

  async create(dto: CreateCommentDto) {
    const hasCommentedBefore = await this.commentRepo.exists({
      where: {
        userId: dto.userId,
        novelId: dto.novelId,
      },
    });

    if (hasCommentedBefore)
      throw new ConflictError(
        "duplicate_comment",
        "Bu seriye zaten bir inceleme bırakmışsınız",
      );

    return await this.commentRepo.manager.transaction(async (manager) => {
      await manager.increment(
        Novel,
        { id: dto.novelId },
        "totalReviewsCount",
        1,
      );

      if (dto.isRecommend) {
        await manager.increment(
          Novel,
          { id: dto.novelId },
          "positiveReviewsCount",
          1,
        );
      }

      const newComment = manager.create(Comment, {
        ...dto,
        novelId: dto.novelId, // dto.novelId'den geldiğini belirttiniz
      });

      return await manager.save(Comment, newComment);
    });
  }

  async delete(id: number) {
    const comment = await this.commentRepo.findOne({
      where: { id },
      select: ["id", "novelId", "isRecommend"],
    });

    if (!comment) {
      throw new NotFoundError("Yorum bulunamadı.");
    }

    return await this.commentRepo.manager.transaction(async (manager) => {
      await manager.delete(Comment, id);

      await manager.decrement(
        Novel,
        { id: comment.novelId },
        "totalReviewsCount",
        1,
      );

      if (comment.isRecommend) {
        await manager.decrement(
          Novel,
          { id: comment.novelId },
          "positiveReviewsCount",
          1,
        );
      }
    });
  }

  async getTopCommentsOfLastWeek(): Promise<Comment[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return await this.commentRepo
      .createQueryBuilder("comment")
      .where("comment.createdAt >= :oneWeekAgo", { oneWeekAgo })
      .orderBy("comment.likeCount", "DESC")
      .take(10)
      .getMany();
  }

  async getLast3CommentsWithCount(novelId: string) {
    const [items, total] = await this.commentRepo.findAndCount({
      where: { novel: { id: novelId } },
      order: { createdAt: "DESC" },
      take: 3,
      select: {
        id: true,
        content: true,
        isRecommend: true,
        createdAt: true,
        user: { id: true, nickname: true, profileImageUrl: true },
      },
      relations: {
        user: true,
      },
    });

    return {
      items,
      total,
    };
  }

  async getCommentsByNovelId(dto: GetCommentsDto, userId?: string) {
    const { novelId, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user")
      .where("comment.novelId = :novelId", { novelId })
      .orderBy("comment.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (userId) {
      query.andWhere("comment.userId != :userId", { userId });

      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("comment_like", "like")
          .where("like.commentId = comment.id")
          .andWhere("like.userId = :userId", { userId });
      }, "viewerHasLiked");
    }

    const { entities, raw } = await query.getRawAndEntities();
    const total = await query.getCount();

    const items = entities.map((comment, index) => {
      const hasLiked = userId ? parseInt(raw[index].viewerHasLiked) > 0 : false;

      return {
        id: comment.id,
        content: comment.content,
        isRecommend: comment.isRecommend,
        createdAt: comment.createdAt,
        likeCount: comment.likeCount,
        replyCount: comment.replyCount,
        user: {
          id: comment.user?.id,
          nickname: comment.user?.nickname,
          profileImageUrl: comment.user?.profileImageUrl,
        },
        viewerHasLiked: hasLiked,
      };
    });

    const totalPage = Math.ceil(total / limit);

    return {
      items: items as any[],
      total,
      currentPage: page,
      nextPage: page < totalPage ? page + 1 : null,
      lastPage: totalPage,
    };
  }

  async getMyComment(novelId: string, userId: string) {
    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user")
      .where("comment.novelId = :novelId", { novelId })
      .andWhere("comment.userId = :userId", { userId });

    query.addSelect((subQuery) => {
      return subQuery
        .select("COUNT(like.userId)", "cnt")
        .from("comment_like", "like")
        .where("like.commentId = comment.id")
        .andWhere("like.userId = :userId", { userId });
    }, "viewerHasLiked");

    const result = await query.getRawAndEntities();
    const entity = result.entities[0];
    const raw = result.raw[0];

    if (!entity) return null;

    return {
      ...entity,
      viewerHasLiked: raw ? parseInt(raw.viewerHasLiked) > 0 : false,
    };
  }

  async isOwner(commentId: number, userId: string) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      select: {
        id: true,
        novelId: true,
        isRecommend: true,
        userId: true,
      },
    });

    if (!comment) {
      return null;
    }
    return comment.userId === userId
      ? { novelId: comment.novelId, isRecommend: comment.isRecommend }
      : null;
  }

  async getOneById(id: number): Promise<Comment | null> {
    return await this.commentRepo.findOne({
      where: { id },
      select: {
        id: true,
        content: true,
        isRecommend: true,
        createdAt: true,
        updatedAt: true,
        likeCount: true,
        replyCount: true,
        user: { id: true, nickname: true, profileImageUrl: true },
      },
      relations: {
        user: true,
      },
    });
  }
}
