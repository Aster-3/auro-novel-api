import { BadRequestError } from "../errors/bad.request.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IChapterCommentService } from "../interfaces/chapter.comment.service.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import {
  CreateChapterCommentDto,
  CreateChapterCommentReplyDto,
} from "../schemas/create.chapter.comment.schema.js";
import { GetChapterCommentsDto } from "../schemas/get.chapter.comments.schema.js";

export class ChapterCommentService implements IChapterCommentService {
  constructor(private uow: IUnitOfWork) {}

  async createComment(
    dto: CreateChapterCommentDto & {
      userId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ) {
    this.ensureCommentHasContentOrImage(dto.content, dto.imageUrl);

    const chapter = await this.uow.chapterPublicationRepository.getChapterForReading(
      dto.chapterId,
    );

    if (!chapter) {
      throw new NotFoundError("Bolum bulunamadi.");
    }

    const novel = await this.uow.novelRepository.findOneById(
      chapter.novelId,
      dto.userId,
    );
    if (!novel) {
      throw new NotFoundError("Bolum bulunamadi.");
    }

    return await this.uow.chapterCommentRepository.createRoot({
      ...dto,
      novelId: chapter.novelId,
    });
  }

  async createReply(
    dto: CreateChapterCommentReplyDto & {
      rootCommentId: number;
      userId: string;
      imageUrl?: string | null;
      imageWidth?: number | null;
      imageHeight?: number | null;
    },
  ) {
    this.ensureCommentHasContentOrImage(dto.content, dto.imageUrl);

    const rootComment = await this.uow.chapterCommentRepository.getMetaById(
      dto.rootCommentId,
    );

    if (!rootComment || rootComment.deletedAt) {
      throw new NotFoundError("Ana yorum bulunamadi.");
    }

    await this.ensureUsersCanInteract(dto.userId, rootComment.userId);

    if (rootComment.rootCommentId) {
      throw new BadRequestError("Yaniti sadece ana yorum altinda olusturabilirsiniz.");
    }

    const parentCommentId = dto.parentCommentId ?? dto.rootCommentId;
    const parentComment = await this.uow.chapterCommentRepository.getMetaById(
      parentCommentId,
    );

    if (!parentComment || parentComment.deletedAt) {
      throw new NotFoundError("Parent yorum bulunamadi.");
    }

    await this.ensureUsersCanInteract(dto.userId, parentComment.userId);

    const parentRootId = parentComment.rootCommentId ?? parentComment.id;
    if (
      parentRootId !== rootComment.id ||
      parentComment.chapterId !== rootComment.chapterId
    ) {
      throw new BadRequestError("Parent yorum bu yorum zincirine ait degil.");
    }

    return await this.uow.chapterCommentRepository.createReply({
      ...dto,
      chapterId: rootComment.chapterId,
      novelId: rootComment.novelId,
      rootCommentId: rootComment.id,
      parentCommentId,
    });
  }

  async deleteComment(commentId: number, userId: string) {
    const isOwner = await this.uow.chapterCommentRepository.isOwner(
      commentId,
      userId,
    );

    if (!isOwner) {
      throw new ForbiddenError("Bu yorumu silmeye yetkiniz yok.");
    }

    await this.uow.chapterCommentRepository.delete(commentId);
  }

  async getCommentsByChapterId(dto: GetChapterCommentsDto, userId?: string) {
    if (!dto.chapterId) {
      throw new BadRequestError("Chapter id zorunludur.");
    }

    const chapter = await this.uow.chapterPublicationRepository.getChapterForReading(
      dto.chapterId,
    );

    if (!chapter) {
      throw new NotFoundError("Bolum bulunamadi.");
    }

    return await this.uow.chapterCommentRepository.getRootComments(dto, userId);
  }

  async getRepliesByCommentId(
    dto: GetChapterCommentsDto & { rootCommentId: number },
    userId?: string,
  ) {
    const rootComment = await this.uow.chapterCommentRepository.getMetaById(
      dto.rootCommentId,
    );

    if (!rootComment) {
      throw new NotFoundError("Ana yorum bulunamadi.");
    }

    if (rootComment.rootCommentId) {
      throw new BadRequestError("Reply listesi icin ana yorum id kullanilmalidir.");
    }

    return await this.uow.chapterCommentRepository.getReplies(dto, userId);
  }

  async getOneCommentById(id: number, userId?: string) {
    return await this.uow.chapterCommentRepository.getOneById(id, userId);
  }

  async toggleLike(userId: string, commentId: number) {
    const comment = await this.uow.chapterCommentRepository.getMetaById(commentId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundError("Yorum bulunamadi.");
    }

    await this.ensureUsersCanInteract(userId, comment.userId);

    return await this.uow.chapterCommentLikeRepository.toggleLike(
      userId,
      commentId,
    );
  }

  private async ensureUsersCanInteract(userId: string, targetUserId: string) {
    if (userId === targetUserId) return;

    const blocked = await this.uow.userBlockRepository.existsBetween(
      userId,
      targetUserId,
    );

    if (blocked) {
      throw new NotFoundError("Yorum bulunamadi.");
    }
  }

  private ensureCommentHasContentOrImage(content: string, imageUrl?: string | null) {
    if (!content.trim() && !imageUrl) {
      throw new BadRequestError("Yorum veya gorsel zorunludur.");
    }
  }
}
