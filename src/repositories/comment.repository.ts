import { Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { Novel } from "../entities/_index.js";
import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { GetUserShowcaseDto } from "../schemas/get.user.showcase.schema.js";
import { CommentSortType } from "../constants/comment.constants.js";
import { presentUser } from "../utils/deleted.user.presenter.js";
import { applyBlockedUserVisibilityFilter } from "../utils/user.block.visibility.js";
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
      .innerJoin("comment.novel", "novel")
      .innerJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .where("comment.createdAt >= :oneWeekAgo", { oneWeekAgo })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
      .andWhere("(author.userId IS NULL OR authorUser.id IS NOT NULL)")
      .orderBy("comment.likeCount", "DESC")
      .take(10)
      .getMany();
  }

  async getLast3CommentsWithCount(novelId: string, viewerId?: string) {
    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user")
      .where("comment.novelId = :novelId", { novelId })
      .select([
        "comment.id",
        "comment.content",
        "comment.isRecommend",
        "comment.createdAt",
        "user.id",
        "user.username",
        "user.nickname",
        "user.profileImageUrl",
      ])
      .orderBy("comment.createdAt", "DESC")
      .take(3);

    applyBlockedUserVisibilityFilter(query, viewerId, "user");

    const [items, total] = await query.getManyAndCount();

    const reviewCountsByUserId = await this.getReviewCountsByUserIds(
      items.map((comment) => comment.user?.id).filter(Boolean) as string[],
    );

    items.forEach((comment) => {
      if (!comment.user?.id) return;
      (comment.user as any).reviewCount =
        reviewCountsByUserId.get(comment.user.id) ?? 0;
    });

    return {
      items: items.map((comment) => ({
        id: comment.id,
        content: comment.content,
        isRecommend: comment.isRecommend,
        createdAt: comment.createdAt,
        user: {
          ...presentUser(comment.user),
          reviewCount: comment.user?.id
            ? ((comment.user as any).reviewCount ?? 0)
            : 0,
        },
      })),
      total,
    };
  }

  async getCommentsByNovelId(dto: GetCommentsDto, userId?: string) {
    const {
      novelId,
      page = 1,
      limit = 10,
      sort = CommentSortType.NEWEST,
    } = dto;
    const skip = (page - 1) * limit;

    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user")
      .where("comment.novelId = :novelId", { novelId })
      .skip(skip)
      .take(limit);

    if (sort === CommentSortType.OLDEST) {
      query.orderBy("comment.createdAt", "ASC");
    } else if (sort === CommentSortType.POPULAR) {
      query
        .orderBy("comment.likeCount", "DESC")
        .addOrderBy("comment.replyCount", "DESC")
        .addOrderBy("comment.createdAt", "DESC");
    } else if (sort === CommentSortType.MOST_LIKED) {
      query
        .orderBy("comment.likeCount", "DESC")
        .addOrderBy("comment.createdAt", "DESC");
    } else {
      query.orderBy("comment.createdAt", "DESC");
    }

    if (userId) {
      query.andWhere("comment.userId != :userId", { userId });
      applyBlockedUserVisibilityFilter(query, userId, "user");

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
    const reviewCountsByUserId = await this.getReviewCountsByUserIds(
      entities.map((comment) => comment.user?.id).filter(Boolean) as string[],
    );

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
          ...presentUser(comment.user),
          reviewCount: comment.user?.id
            ? (reviewCountsByUserId.get(comment.user.id) ?? 0)
            : 0,
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

  async getOneById(id: number, viewerId?: string): Promise<Comment | null> {
    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user")
      .innerJoin("comment.novel", "novel")
      .where("comment.id = :id", { id })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
      .select([
        "comment.id",
        "comment.content",
        "comment.isRecommend",
        "comment.createdAt",
        "comment.updatedAt",
        "comment.likeCount",
        "comment.replyCount",
        "user.id",
        "user.username",
        "user.nickname",
        "user.profileImageUrl",
      ]);

    applyBlockedUserVisibilityFilter(query, viewerId, "user");

    const comment = await query.getOne();

    if (!comment) return null;

    return {
      id: comment.id,
      content: comment.content,
      isRecommend: comment.isRecommend,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      user: presentUser(comment.user),
    } as any;
  }

  async getReviewsByUserId(dto: GetUserShowcaseDto, viewerId?: string) {
    const { userId, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoin("comment.user", "user")
      .leftJoinAndSelect("comment.novel", "novel")
      .innerJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .where("comment.userId = :userId", { userId })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
      .andWhere("(author.userId IS NULL OR authorUser.id IS NOT NULL)")
      .orderBy("comment.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (viewerId) {
      applyBlockedUserVisibilityFilter(query, viewerId, "user");
      applyBlockedUserVisibilityFilter(query, viewerId, "authorUser");

      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("comment_like", "like")
          .where("like.commentId = comment.id")
          .andWhere("like.userId = :viewerId", { viewerId });
      }, "viewerHasLiked");
    }

    const { entities, raw } = await query.getRawAndEntities();
    const total = await query.getCount();

    const items = entities.map((comment, index) => {
      const hasLiked = viewerId
        ? parseInt(raw[index].viewerHasLiked) > 0
        : false;

      return {
        id: comment.id,
        content: comment.content,
        isRecommend: comment.isRecommend,
        createdAt: comment.createdAt,
        likeCount: comment.likeCount,
        replyCount: comment.replyCount,
        novel: {
          id: comment.novel?.id,
          name: comment.novel?.name,
          slug: comment.novel?.slug,
          coverImageUrl: comment.novel?.coverImage,
        },
        viewerHasLiked: hasLiked,
      };
    });

    const totalPage = Math.ceil(total / limit);

    return {
      items,
      total,
      currentPage: page,
      nextPage: page < totalPage ? page + 1 : null,
      lastPage: totalPage,
    };
  }

  async getNotificationMetaById(id: number) {
    const comment = await this.commentRepo
      .createQueryBuilder("comment")
      .innerJoin("comment.novel", "novel")
      .where("comment.id = :id", { id })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
      .select(["comment.id", "comment.userId", "comment.novelId"])
      .getOne();

    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      userId: comment.userId,
      novelId: comment.novelId,
    };
  }

  private async getReviewCountsByUserIds(userIds: string[]) {
    const uniqueUserIds = [...new Set(userIds)];
    if (!uniqueUserIds.length) return new Map<string, number>();

    const rows = await this.commentRepo
      .createQueryBuilder("comment")
      .select("comment.userId", "userId")
      .addSelect("COUNT(comment.id)", "reviewCount")
      .where("comment.userId IN (:...userIds)", { userIds: uniqueUserIds })
      .groupBy("comment.userId")
      .getRawMany<{ userId: string; reviewCount: string }>();

    return new Map(
      rows.map((row) => [row.userId, Number(row.reviewCount)] as const),
    );
  }
}
