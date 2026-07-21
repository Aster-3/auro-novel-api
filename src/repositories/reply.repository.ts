import { Repository } from "typeorm";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { Reply } from "../entities/Reply.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { Comment } from "../entities/Comment.js";
import { GetUserShowcaseDto } from "../schemas/get.user.showcase.schema.js";
import { presentUser } from "../utils/deleted.user.presenter.js";

export class ReplyRepository implements IReplyRepository {
  constructor(private replyRepo: Repository<Reply>) {}

  create = async (replyDto: CreateReplyDto & { userId: string }) => {
    return await this.replyRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const newReply = await transactionalEntityManager.save(
          this.replyRepo.target,
          replyDto,
        );
        if (replyDto.rootCommentId) {
          await transactionalEntityManager.increment(
            Comment,
            { id: replyDto.rootCommentId },
            "replyCount",
            1,
          );
        }

        return newReply;
      },
    );
  };

  delete = async (id: number) => {
    return await this.replyRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const reply = await transactionalEntityManager.findOne(Reply, {
          where: { id },
        });

        if (!reply) {
          throw new Error("Silinecek yanıt bulunamadı.");
        }

        await transactionalEntityManager.update(Reply, id, {
          deletedAt: new Date(),
          content: "",
        });

        await transactionalEntityManager.decrement(
          Comment,
          { id: reply.rootCommentId },
          "replyCount",
          1,
        );
      },
    );
  };

  isOwner = async (replyId: number, userId: string) => {
    const reply = await this.replyRepo.findOne({
      where: { id: replyId, userId },
    });
    return !!reply;
  };

  getNotificationMetaById = async (id: number) => {
    const reply = await this.replyRepo.findOne({
      where: { id },
      withDeleted: true,
      select: {
        id: true,
        userId: true,
        rootCommentId: true,
        deletedAt: true,
      },
    });

    if (!reply) {
      return null;
    }

    return {
      id: reply.id,
      userId: reply.userId,
      rootCommentId: reply.rootCommentId,
      deletedAt: reply.deletedAt,
    };
  };

  getCommentReplies = async (dto: GetCommentRepliesDto) => {
    const { id: rootCommentId, page = 1, limit = 10, userId } = dto;
    const skip = (page - 1) * limit;

    // 1. Sorgu Hazırlığı
    const query = this.replyRepo
      .createQueryBuilder("reply")
      .withDeleted() // Silinmiş parent'ları görebilmek için bu şart
      .leftJoinAndSelect("reply.user", "user")
      .leftJoinAndSelect("reply.parentReply", "parentReply")
      .leftJoinAndSelect("parentReply.user", "parentUser")
      .where("reply.rootCommentId = :rootCommentId", { rootCommentId })
      // KRİTİK FİLTRE: Ana listenin kendisinde silinmişleri istemiyoruz
      .andWhere("reply.deletedAt IS NULL")
      .orderBy("reply.createdAt", "ASC")
      .skip(skip)
      .take(limit);

    if (userId) {
      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("reply_like", "like")
          .where("like.replyId = reply.id")
          .andWhere("like.userId = :userId", { userId });
      }, "viewerHasLiked");
    }

    // 3. Verileri Çek
    const { entities, raw } = await query.getRawAndEntities();
    // Count işlemi de 'deletedAt IS NULL' filtresine takılacağı için gerçek sayıyı döner
    const total = await query.getCount();

    // 4. Formatlama (Mapping)
    const items = entities.map((reply, index) => {
      const hasLiked = userId ? parseInt(raw[index].viewerHasLiked) > 0 : false;

      return {
        id: reply.id,
        content: reply.content,
        likeCount: reply.likeCount,
        createdAt: reply.createdAt,
        user: presentUser(reply.user),
        // Üst yanıt (parent) kontrolü
        parentReply: reply.parentReply
          ? {
              content: reply.parentReply.deletedAt
                ? null
                : reply.parentReply.content,
              isDeleted: !!reply.parentReply.deletedAt, // Frontend'de "Silinmiş bir yanıta yanıt verdi" demek için
              user: presentUser(reply.parentReply.user),
            }
          : null,
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
  };

  getRepliesByUserId = async (
    dto: GetUserShowcaseDto,
    viewerId?: string,
  ) => {
    const { userId, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const query = this.replyRepo
      .createQueryBuilder("reply")
      .withDeleted()
      .leftJoinAndSelect("reply.comment", "comment")
      .leftJoinAndSelect("comment.novel", "novel")
      .innerJoin("novel.author", "author")
      .leftJoin("author.user", "authorUser")
      .leftJoinAndSelect("reply.parentReply", "parentReply")
      .leftJoinAndSelect("parentReply.user", "parentUser")
      .where("reply.userId = :userId", { userId })
      .andWhere("reply.deletedAt IS NULL")
      .andWhere("author.userId IS NULL OR authorUser.id IS NOT NULL")
      .orderBy("reply.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    if (viewerId) {
      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("reply_like", "like")
          .where("like.replyId = reply.id")
          .andWhere("like.userId = :viewerId", { viewerId });
      }, "viewerHasLiked");
    }

    const { entities, raw } = await query.getRawAndEntities();
    const total = await query.getCount();

    const items = entities.map((reply, index) => {
      const hasLiked = viewerId
        ? parseInt(raw[index].viewerHasLiked) > 0
        : false;

      return {
        id: reply.id,
        content: reply.content,
        likeCount: reply.likeCount,
        createdAt: reply.createdAt,
        rootComment: {
          id: reply.comment?.id,
          content: reply.comment?.content,
          userId: reply.comment?.userId,
        },
        novel: {
          id: reply.comment?.novel?.id,
          name: reply.comment?.novel?.name,
          slug: reply.comment?.novel?.slug,
          coverImageUrl: reply.comment?.novel?.coverImage,
        },
        parentReply: reply.parentReply
          ? {
              id: reply.parentReply.id,
              content: reply.parentReply.deletedAt
                ? null
                : reply.parentReply.content,
              isDeleted: !!reply.parentReply.deletedAt,
              user: presentUser(reply.parentReply.user),
            }
          : null,
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
  };
}
