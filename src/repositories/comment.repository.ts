import { Repository } from "typeorm";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { Comment } from "../entities/Comment.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { Novel } from "../entities/_index.js";
import { ConflictError } from "../errors/conflict.error.js";
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
    await this.commentRepo.delete(id);
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

  getLast3CommentsByNovelId(novelId: string) {
    return this.commentRepo.find({
      where: { novel: { id: novelId } },
      order: { createdAt: "DESC" },
      take: 3,
      select: {
        id: true,
        user: { id: true, nickname: true, profileImageUrl: true },
        content: true,
        isRecommend: true,
        createdAt: true,
      },
      relations: {
        user: true,
      },
    });
  }
  async getCommentsByNovelId(dto: GetCommentsDto, userId?: string) {
    const { novelId, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    // 1. Sorgu Hazırlığı
    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user") // Yorum sahibini getir
      .where("comment.novelId = :novelId", { novelId })
      .orderBy("comment.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    // 2. Koşullu Filtreleme ve Beğeni Kontrolü
    if (userId) {
      // Kendi yorumunu genel listeden çıkar
      query.andWhere("comment.userId != :userId", { userId });

      // Kullanıcının her bir yorumu beğenip beğenmediğini hızlıca kontrol et (Subquery)
      query.addSelect((subQuery) => {
        return subQuery
          .select("COUNT(like.userId)", "cnt")
          .from("comment_like", "like")
          .where("like.commentId = comment.id")
          .andWhere("like.userId = :userId", { userId });
      }, "viewerHasLiked");
    }

    // 3. Veritabanı İsteği
    const { entities, raw } = await query.getRawAndEntities();
    const total = await query.getCount();

    // 4. Veri Formatlama (Mapping)
    const items = entities.map((comment, index) => {
      // raw[index].viewerHasLiked, PostgreSQL'de string (örn: "1" veya "0") döner.
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
    return await this.commentRepo.findOne({
      where: {
        novelId,
        userId,
      },
      select: {
        id: true,
        content: true,
        isRecommend: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        user: {
          id: true,
          nickname: true,
          profileImageUrl: true,
        },
      },
      relations: {
        user: true,
      },
    });
  }
}
