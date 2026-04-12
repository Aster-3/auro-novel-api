import { NotFoundError } from "../errors/not.found.error.js";
import { ICommentLikeRepository } from "../interfaces/comment.like.repo.interface.js";
import { ICommentRepository } from "../interfaces/comment.repo.interface.js";
import { ICommentService } from "../interfaces/comment.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { CreateCommentDto } from "../schemas/create.comment.schema.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";
import { GetCommentsDto } from "../schemas/get.comments.schema.js";
import { calculateRankingScore } from "../utils/calculateNovelRankingScore.js";

export class CommentService implements ICommentService {
  constructor(private uow: IUnitOfWork) {}

  createComment = async (dto: CreateCommentDto) => {
    const novelExists = await this.uow.novelRepository.existControl({
      id: dto.novelId,
    });
    if (!novelExists) {
      throw new NotFoundError("Novel not found");
    }

    await this.uow.startTransaction();

    try {
      const comment = await this.uow.commentRepository.create(dto);
      const novel =
        await this.uow.novelRepository.incrementAndDecrementReviewCount(
          dto.novelId,
          true,
          dto.isRecommend,
        );

      const newScore = calculateRankingScore(
        novel.positiveReviewsCount,
        novel.totalReviewsCount,
        novel.totalSales,
      );
      await this.uow.novelRepository.updateRankingScore(dto.novelId, newScore);

      await this.uow.commit();
      return comment;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  };

  deleteComment = async (id: number, userId: string) => {
    // 1. Yorumun varlığını ve sahipliğini kontrol et (Veriyi de çekmiş oluyoruz)
    const comment = await this.uow.commentRepository.isOwner(id, userId);

    if (!comment) {
      throw new NotFoundError(
        "Yorum bulunamadı veya bu işlemi yapmaya yetkiniz yok.",
      );
    }

    await this.uow.startTransaction();

    try {
      // 2. Yorumu sil
      await this.uow.commentRepository.delete(id);

      const updatedStats =
        await this.uow.novelRepository.incrementAndDecrementReviewCount(
          comment.novelId,
          false, // Azaltma işlemi
          comment.isRecommend, // Pozitif miydi?
        );

      // 4. Skoru yeniden hesapla ve güncelle
      const newScore = calculateRankingScore(
        updatedStats.positiveReviewsCount,
        updatedStats.totalReviewsCount,
        updatedStats.totalSales,
      );
      await this.uow.novelRepository.updateRankingScore(
        comment.novelId,
        newScore,
      );

      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  };

  getCommentsByNovelId = async (dto: GetCommentsDto, userId?: string) => {
    return await this.uow.commentRepository.getCommentsByNovelId(dto, userId);
  };

  getTopCommentsOfLastWeek = async () => {
    return await this.uow.commentRepository.getTopCommentsOfLastWeek();
  };

  getCommentReplies(dto: GetCommentRepliesDto) {
    return this.uow.replyRepository.getCommentReplies(dto);
  }

  async toggleLike(userId: string, commentId: number) {
    return await this.uow.commentLikeRepository?.toggleLike(userId, commentId)!;
  }

  getLast3CommentsByNovelId(novelId: string) {
    return this.uow.commentRepository.getLast3CommentsWithCount(novelId);
  }

  getMyComment(novelId: string, userId: string) {
    return this.uow.commentRepository.getMyComment(novelId, userId);
  }

  getOneCommentById(id: number) {
    return this.uow.commentRepository.getOneById(id);
  }
}
