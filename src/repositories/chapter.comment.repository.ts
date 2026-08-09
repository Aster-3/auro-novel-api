import { Repository } from "typeorm";
import { Chapter } from "../entities/Chapter.js";
import { ChapterComment } from "../entities/ChapterComment.js";
import { IChapterCommentRepository } from "../interfaces/chapter.comment.repo.interface.js";
import {
  CreateChapterCommentDto,
  CreateChapterCommentReplyDto,
} from "../schemas/create.chapter.comment.schema.js";
import { GetChapterCommentsDto } from "../schemas/get.chapter.comments.schema.js";
import { presentUser } from "../utils/deleted.user.presenter.js";
import { applyBlockedUserVisibilityFilter } from "../utils/user.block.visibility.js";

export class ChapterCommentRepository implements IChapterCommentRepository {
  constructor(private commentRepo: Repository<ChapterComment>) {}

  async createRoot(
    dto: CreateChapterCommentDto & {
      userId: string;
      novelId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ) {
    return await this.commentRepo.manager.transaction(async (manager) => {
      const comment = manager.create(ChapterComment, {
        content: dto.content,
        userId: dto.userId,
        chapterId: dto.chapterId,
        novelId: dto.novelId,
        imageUrl: dto.imageUrl ?? null,
        imageWidth: dto.imageUrl ? (dto.imageWidth ?? null) : null,
        imageHeight: dto.imageUrl ? (dto.imageHeight ?? null) : null,
        rootCommentId: null,
        parentCommentId: null,
      });

      const saved = await manager.save(ChapterComment, comment);
      await manager.increment(Chapter, { id: dto.chapterId }, "commentCount", 1);
      return saved;
    });
  }

  async createReply(
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
  ) {
    return await this.commentRepo.manager.transaction(async (manager) => {
      const reply = manager.create(ChapterComment, {
        content: dto.content,
        userId: dto.userId,
        chapterId: dto.chapterId,
        novelId: dto.novelId,
        imageUrl: dto.imageUrl ?? null,
        imageWidth: dto.imageUrl ? (dto.imageWidth ?? null) : null,
        imageHeight: dto.imageUrl ? (dto.imageHeight ?? null) : null,
        rootCommentId: dto.rootCommentId,
        parentCommentId: dto.parentCommentId,
      });

      const saved = await manager.save(ChapterComment, reply);
      await manager.increment(
        ChapterComment,
        { id: dto.rootCommentId },
        "replyCount",
        1,
      );
      await manager.increment(Chapter, { id: dto.chapterId }, "commentCount", 1);
      return saved;
    });
  }

  async delete(id: number) {
    return await this.commentRepo.manager.transaction(async (manager) => {
      const rows = await manager.query<
        {
          id: number;
          imageUrl: string | null;
          rootCommentId: number | null;
          chapterId: string;
        }[]
      >(
        `
          WITH RECURSIVE subtree AS (
            SELECT
              id,
              "imageUrl",
              "rootCommentId",
              "chapterId",
              "parentCommentId"
            FROM "chapter_comment"
            WHERE id = $1 AND "deletedAt" IS NULL

            UNION ALL

            SELECT
              child.id,
              child."imageUrl",
              child."rootCommentId",
              child."chapterId",
              child."parentCommentId"
            FROM "chapter_comment" child
            INNER JOIN subtree parent ON child."parentCommentId" = parent.id
            WHERE child."deletedAt" IS NULL
          )
          SELECT
            id,
            "imageUrl" AS "imageUrl",
            "rootCommentId" AS "rootCommentId",
            "chapterId" AS "chapterId"
          FROM subtree
        `,
        [id],
      );

      if (!rows.length) {
        return [];
      }

      const rootRow = rows.find((row) => row.id === id) ?? rows[0];
      const deletedIds = rows.map((row) => row.id);
      const deletedCount = deletedIds.length;

      await manager
        .createQueryBuilder()
        .delete()
        .from(ChapterComment)
        .where("id IN (:...deletedIds)", { deletedIds })
        .execute();

      if (rootRow.rootCommentId) {
        await manager
          .createQueryBuilder()
          .update(ChapterComment)
          .set({
            replyCount: () => `GREATEST("replyCount" - ${deletedCount}, 0)`,
          })
          .where("id = :rootCommentId", {
            rootCommentId: rootRow.rootCommentId,
          })
          .execute();
      }

      await manager
        .createQueryBuilder()
        .update(Chapter)
        .set({
          commentCount: () => `GREATEST("commentCount" - ${deletedCount}, 0)`,
        })
        .where("id = :chapterId", { chapterId: rootRow.chapterId })
        .execute();

      return rows
        .map((row) => row.imageUrl)
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
    });
  }

  async getRootComments(dto: GetChapterCommentsDto, userId?: string) {
    const { chapterId, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user")
      .where("comment.chapterId = :chapterId", { chapterId })
      .andWhere("comment.rootCommentId IS NULL")
      .andWhere("(comment.deletedAt IS NULL OR comment.replyCount > 0)")
      .orderBy("comment.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (userId) {
      applyBlockedUserVisibilityFilter(query, userId, "user");

      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("chapter_comment_like", "like")
          .where("like.commentId = comment.id")
          .andWhere("like.userId = :userId", { userId });
      }, "viewerHasLiked");
    }

    const { entities, raw } = await query.getRawAndEntities();
    const total = await query.getCount();
    const items = entities.map((comment, index) =>
      this.formatComment(comment, userId ? parseInt(raw[index].viewerHasLiked) > 0 : false),
    );

    return this.paginate(items as any[], total, page, limit);
  }

  async getReplies(
    dto: GetChapterCommentsDto & { rootCommentId: number },
    userId?: string,
  ) {
    const { rootCommentId, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const query = this.commentRepo
      .createQueryBuilder("comment")
      .withDeleted()
      .leftJoinAndSelect("comment.user", "user")
      .leftJoinAndSelect("comment.parentComment", "parentComment")
      .leftJoinAndSelect("parentComment.user", "parentUser")
      .where("comment.rootCommentId = :rootCommentId", { rootCommentId })
      .andWhere("comment.deletedAt IS NULL")
      .orderBy("comment.createdAt", "ASC")
      .skip(skip)
      .take(limit);

    if (userId) {
      applyBlockedUserVisibilityFilter(query, userId, "user");
      applyBlockedUserVisibilityFilter(query, userId, "parentUser");

      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("chapter_comment_like", "like")
          .where("like.commentId = comment.id")
          .andWhere("like.userId = :userId", { userId });
      }, "viewerHasLiked");
    }

    const { entities, raw } = await query.getRawAndEntities();
    const total = await query.getCount();
    const items = entities.map((comment, index) =>
      this.formatComment(
        comment,
        userId ? parseInt(raw[index].viewerHasLiked) > 0 : false,
        true,
      ),
    );

    return this.paginate(items as any[], total, page, limit);
  }

  async getOneById(id: number, userId?: string): Promise<ChapterComment | null> {
    const query = this.commentRepo
      .createQueryBuilder("comment")
      .withDeleted()
      .leftJoinAndSelect("comment.user", "user")
      .innerJoin("comment.novel", "novel")
      .leftJoinAndSelect("comment.parentComment", "parentComment")
      .leftJoinAndSelect("parentComment.user", "parentUser")
      .where("comment.id = :id", { id })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())');

    if (userId) {
      applyBlockedUserVisibilityFilter(query, userId, "user");
      applyBlockedUserVisibilityFilter(query, userId, "parentUser");

      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("chapter_comment_like", "like")
          .where("like.commentId = comment.id")
          .andWhere("like.userId = :userId", { userId });
      }, "viewerHasLiked");
    }

    const { entities, raw } = await query.getRawAndEntities();
    const comment = entities[0];
    if (!comment) return null;

    return this.formatComment(
      comment,
      userId && raw[0] ? parseInt(raw[0].viewerHasLiked) > 0 : false,
      true,
    ) as any;
  }

  async getMetaById(id: number) {
    const comment = await this.commentRepo
      .createQueryBuilder("comment")
      .withDeleted()
      .innerJoin("comment.novel", "novel")
      .where("comment.id = :id", { id })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
      .select([
        "comment.id",
        "comment.userId",
        "comment.chapterId",
        "comment.novelId",
        "comment.rootCommentId",
        "comment.parentCommentId",
        "comment.deletedAt",
      ])
      .getOne();

    if (!comment) return null;

    return {
      id: comment.id,
      userId: comment.userId,
      chapterId: comment.chapterId,
      novelId: comment.novelId,
      rootCommentId: comment.rootCommentId,
      parentCommentId: comment.parentCommentId,
      deletedAt: comment.deletedAt,
    };
  }

  async isOwner(commentId: number, userId: string) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, userId },
      select: { id: true },
    });
    return !!comment;
  }

  private formatComment(
    comment: ChapterComment,
    viewerHasLiked: boolean,
    includeParent = false,
  ) {
    return {
      id: comment.id,
      content: comment.deletedAt ? null : comment.content,
      imageUrl: comment.deletedAt ? null : comment.imageUrl,
      imageWidth: comment.deletedAt ? null : comment.imageWidth,
      imageHeight: comment.deletedAt ? null : comment.imageHeight,
      isDeleted: !!comment.deletedAt,
      chapterId: comment.chapterId,
      novelId: comment.novelId,
      rootCommentId: comment.rootCommentId,
      parentCommentId: comment.parentCommentId,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: presentUser(comment.user),
      parentComment:
        includeParent && comment.parentComment
          ? {
              id: comment.parentComment.id,
              content: comment.parentComment.deletedAt
                ? null
                : comment.parentComment.content,
              imageUrl: comment.parentComment.deletedAt
                ? null
                : comment.parentComment.imageUrl,
              imageWidth: comment.parentComment.deletedAt
                ? null
                : comment.parentComment.imageWidth,
              imageHeight: comment.parentComment.deletedAt
                ? null
                : comment.parentComment.imageHeight,
              isDeleted: !!comment.parentComment.deletedAt,
              user: presentUser(comment.parentComment.user),
            }
          : null,
      viewerHasLiked,
    };
  }

  private paginate(items: any[], total: number, page: number, limit: number) {
    const totalPage = Math.ceil(total / limit);

    return {
      items,
      total,
      currentPage: page,
      nextPage: page < totalPage ? page + 1 : null,
      lastPage: totalPage,
    };
  }
}
