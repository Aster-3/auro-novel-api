import { Repository } from "typeorm";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { Reply } from "../entities/Reply.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { Comment } from "../entities/Comment.js";

export class ReplyRepository implements IReplyRepository {
  constructor(private replyRepo: Repository<Reply>) {}

  create = async (replyDto: CreateReplyDto) => {
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
        user: {
          id: reply.user?.id,
          nickname: reply.user?.nickname,
          profileImageUrl: reply.user?.profileImageUrl,
        },
        // Üst yanıt (parent) kontrolü
        parentReply: reply.parentReply
          ? {
              content: reply.parentReply.deletedAt
                ? null
                : reply.parentReply.content,
              isDeleted: !!reply.parentReply.deletedAt, // Frontend'de "Silinmiş bir yanıta yanıt verdi" demek için
              user: {
                nickname: reply.parentReply.user?.nickname || "deleted",
                profileImageUrl: reply.parentReply.user?.profileImageUrl,
              },
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
}
