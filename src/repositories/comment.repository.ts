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
    const { novelId, page, limit } = dto;
    const skip = (page - 1) * limit;

    // 1. Sorgu Hazırlığı: Temel Yorum ve Kullanıcı Bilgileri
    const query = this.commentRepo
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.user", "user") // Yorumun sahibini getir
      .where("comment.novelId = :novelId", { novelId })
      .orderBy("comment.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    // 2. Koşullu Sorgu: Sadece userId varsa 'Beğeni Kontrolü' yap
    if (userId) {
      query
        .leftJoin(
          "comment.likes", // Comment entity içindeki Relation adı (beğeniler tablosu)
          "userLike",
          "userLike.userId = :userId",
          { userId },
        )
        .addSelect(
          "CASE WHEN userLike.id IS NOT NULL THEN true ELSE false END",
          "comment_viewerHasLiked",
        );
      // Not: TypeORM bazen alias eklerken 'comment_' ön ekini kullanır.
    }

    // 3. Verileri Çek
    const [rawComments, total] = await query.getManyAndCount();

    // 4. Veriyi Temizle ve Formatla (Frontend'e hazır hale getir)
    const items = rawComments.map((comment) => ({
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
      viewerHasLiked: userId ? !!(comment as any).viewerHasLiked : false,
    }));

    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;

    return {
      items: items as any,
      total,
      currentPage: page,
      nextPage: nextPage,
      lastPage: totalPage,
    };
  }
}
