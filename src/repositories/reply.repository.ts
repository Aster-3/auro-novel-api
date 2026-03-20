import { Repository } from "typeorm";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { Reply } from "../entities/Reply.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";

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
            "Comment",
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
    await this.replyRepo.delete(id);
  };

  getCommentReplies = async (dto: GetCommentRepliesDto) => {
    const { id: rootCommentId, page = 1, limit = 10, userId } = dto;
    const skip = (page - 1) * limit;

    // 1. Sorgu Hazırlığı
    const query = this.replyRepo
      .createQueryBuilder("reply")
      .leftJoinAndSelect("reply.user", "user") // Yanıtı yazan
      .leftJoinAndSelect("reply.parentReply", "parentReply") // Yanıt verilen üst yanıt
      .leftJoinAndSelect("parentReply.user", "parentUser") // Üst yanıtın sahibi
      .where("reply.rootCommentId = :rootCommentId", { rootCommentId })
      .orderBy("reply.createdAt", "ASC") // Sohbet akışı için eskiden yeniye
      .skip(skip)
      .take(limit);

    // 2. Eğer kullanıcı giriş yapmışsa beğeni durumunu kontrol et
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
    const total = await query.getCount();

    // 4. Formatlama (Mapping)
    const items = entities.map((reply, index) => {
      // Subquery sonucu PostgreSQL'den string gelir ("1" veya "0")
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
        // Eğer bu bir alt yanıtsa (mention), hangi içeriğe ve kime yanıt verildiği
        parentReply: reply.parentReply
          ? {
              content: reply.parentReply.content,
              user: {
                nickname: reply.parentReply.user?.nickname,
              },
            }
          : null,
        viewerHasLiked: hasLiked,
      };
    });

    const totalPage = Math.ceil(total / limit);

    return {
      items: items as any[], // Tip güvenliği için as any kullandık, gerçek projede uygun bir DTO tanımlanabilir
      total,
      currentPage: page,
      nextPage: page < totalPage ? page + 1 : null,
      lastPage: totalPage,
    };
  };
}
