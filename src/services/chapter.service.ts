import { PublicationStatus } from "../constants/chapter.constants.js";
import { ConflictError } from "../errors/conflict.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IChapterService } from "../interfaces/chapter.service.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

export class ChapterService implements IChapterService {
  constructor(private uow: IUnitOfWork) {}

  async createChapter(
    dto: CreateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const isOwner = await this.uow.novelRepository.isOwnerControl(
      dto.novelId,
      authorId,
    );
    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanin sahibi degilsiniz.",
      );
    }
    await this.uow.chapterRepository.createChapter(dto);
  }

  async publishChapter(
    dto: CreatePublicationDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const draft = await this.uow.chapterRepository.getOneDraftChapterById(
      dto.id,
    );

    if (!draft) {
      throw new NotFoundError("Bolum bulunamadi veya zaten yayinlanmis.");
    }

    if (draft.novel.id !== dto.novelId) {
      throw new ConflictError("novel_id", "Gecersiz novel ID.");
    }

    const isOwner = draft.novel?.author?.userId === authorId;
    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanin sahibi degilsiniz.",
      );
    }

    if (!dto.volumeId) {
      const suggestedVolume =
        await this.uow.volumeRepository.findOldestEmptyOrLatestVolume(
          dto.novelId,
        );
      if (!suggestedVolume) {
        throw new ConflictError(
          "volumeId",
          "Bolum eklemek icin en az bir cilt olusturmalisiniz.",
        );
      }
      dto.volumeId = suggestedVolume.id;
    } else {
      const volume = await this.uow.volumeRepository.getOneById(dto.volumeId);

      if (!volume || volume.novelId !== dto.novelId) {
        throw new ConflictError("volumeId", "Gecersiz cilt ID.");
      }

      const lastAddableVolume =
        await this.uow.volumeRepository.findOldestEmptyOrLatestVolume(
          dto.novelId,
        );

      if (
        !lastAddableVolume ||
        volume.orderIndex > lastAddableVolume.orderIndex
      ) {
        throw new ConflictError(
          "volumeId",
          "En fazla bir cilt atlanabilir. Lutfen onceki ciltleri doldurun.",
        );
      }
    }

    const lastOrder =
      await this.uow.chapterPublicationRepository.getLastChapterOrderInVolume(
        dto.volumeId,
      );

    if (!dto.orderIndex || !isAdmin) {
      dto.orderIndex = lastOrder + 1;
    }

    if (dto.orderIndex > lastOrder + 1 || dto.orderIndex <= lastOrder) {
      throw new ConflictError(
        "orderIndex",
        "Bolum siralamasi gecersiz. Mevcut son siradan sonra gelmelidir.",
      );
    }

    await this.uow.startTransaction();
    try {
      await this.uow.chapterPublicationRepository.create({
        chapterId: dto.id,
        volumeId: dto.volumeId,
        orderIndex: dto.orderIndex,
        publishedAt: new Date(),
      });

      await this.uow.novelRepository.refreshChapterStats(dto.novelId);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  }

  async updateChapter(
    dto: UpdateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ) {
    const chapter = await this.uow.chapterRepository.getOneDraftChapterById(
      dto.id,
    );

    if (!chapter) {
      throw new NotFoundError("Bolum bulunamadi veya zaten yayinlanmis.");
    }

    if (!isAdmin && chapter.novel?.author?.userId !== authorId) {
      throw new ConflictError(
        "invalid_access",
        "Bu bolume erisim izniniz yok.",
      );
    }

    await this.uow.chapterRepository.updateChapter(dto);
  }

  async deleteChapter(
    chapterId: string,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const chapterAuthorId =
      await this.uow.chapterRepository.getAuthorIdByChapterId(chapterId);

    if (authorId !== chapterAuthorId && !isAdmin) {
      throw new ConflictError(
        "invalid_access",
        "Bu bolume erisim izniniz yok.",
      );
    }

    const isPublished =
      await this.uow.chapterPublicationRepository.getChapterForMeta(chapterId);

    if (!isPublished) {
      await this.uow.chapterRepository.deleteChapter(chapterId);
      return;
    }

    const hasOtherChaptersInVolume =
      await this.uow.chapterPublicationRepository.otherChaptersExistInVolume(
        chapterId,
        isPublished.volumeId,
      );

    if (!hasOtherChaptersInVolume) {
      const isLastVolumeWithChapters =
        await this.uow.volumeRepository.isLastVolumeWithChapters(
          isPublished.novelId,
          isPublished.volumeOrder,
        );

      if (!isLastVolumeWithChapters) {
        throw new ConflictError(
          "chapterId",
          "Cilt bos birakilamayacagi icin bu bolum silinemez.",
        );
      }
    }

    await this.uow.startTransaction();
    try {
      await this.uow.chapterRepository.deleteChapter(chapterId);
      await this.uow.chapterPublicationRepository.closeGapInVolume(
        isPublished.volumeId,
        isPublished.chapterOrder,
      );
      await this.uow.novelRepository.refreshChapterStats(isPublished.novelId);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  }

  async getChapterForReading(id: string, userId: string, isAdmin: boolean) {
    const data =
      await this.uow.chapterPublicationRepository.getChapterForReading(id);

    if (!data) {
      throw new NotFoundError("Bolum mevcut degil.");
    }

    const isOwner = data.authorId === userId;
    const privilegedUser = isAdmin || isOwner;

    if (
      data.publicationStatus === PublicationStatus.UNPUBLISHED &&
      !privilegedUser
    ) {
      throw new ForbiddenError("Bu bolum yayindan kaldirilmistir.");
    }

    const [nextChapter, previousChapterId] = await Promise.all([
      this.uow.chapterPublicationRepository.getNextChapter(
        data.novelId,
        data.chapterOrder,
        data.volumeOrder,
      ),
      this.uow.chapterPublicationRepository.getPreviousChapter(
        data.novelId,
        data.chapterOrder,
        data.volumeOrder,
      ),
    ]);

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      volumeOrder: data.volumeOrder,
      novelId: data.novelId,
      volumeTitle: data.volumeTitle,
      nextChapterId: nextChapter || null,
      previousChapterId: previousChapterId || null,
      novelStatus: data.novelStatus,
    };
  }

  async getOneDraftChapter(id: string, authorId: string, isAdmin: boolean) {
    const chapter = await this.uow.chapterRepository.getOneDraftChapterById(id);

    if (!chapter) {
      throw new NotFoundError("Bolum bulunamadi veya zaten yayinlanmis.");
    }
    if (!isAdmin && chapter.novel?.author?.userId !== authorId) {
      throw new ConflictError(
        "invalid_access",
        "Bu bolume erisim izniniz yok.",
      );
    }
    return chapter;
  }

  async getDraftChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ) {
    const isOwner = await this.uow.novelRepository.isOwnerControl(
      dto.id,
      userId,
    );

    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanin sahibi degilsiniz.",
      );
    }

    return await this.uow.chapterRepository.getDraftChaptersByNovelId(dto);
  }

  async getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ) {
    return await this.uow.chapterPublicationRepository.getChaptersByNovelId(
      dto,
      userId,
      isAdmin,
    );
  }

  async getNovelDownloadPackage(novelId: string) {
    const novel = await this.uow.novelRepository.findOneById(novelId);

    if (!novel) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    const chapters =
      await this.uow.chapterPublicationRepository.getPublishedChaptersForDownload(
        novelId,
      );

    return {
      novel: {
        id: novel.id,
        name: novel.name,
        coverImage: novel.coverImage ?? null,
        synopsis: novel.synopsis ?? null,
        status: novel.status,
        chapterCount: novel.chapterCount,
        lastChapterDate: novel.lastChapterDate ?? null,
      },
      generatedAt: new Date().toISOString(),
      chapters,
    };
  }

  async getOfflineManifest(novelId: string) {
    const novel = await this.uow.novelRepository.findOneById(novelId);

    if (!novel) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    const chapters =
      await this.uow.chapterPublicationRepository.getPublishedChaptersManifest(
        novelId,
      );

    return {
      novel: {
        id: novel.id,
        name: novel.name,
        slug: novel.slug,
        coverImage: novel.coverImage ?? null,
        synopsis: novel.synopsis ?? null,
        status: novel.status,
        chapterCount: novel.chapterCount,
        lastChapterDate: novel.lastChapterDate ?? null,
        updatedAt: novel.updatedAt,
      },
      generatedAt: new Date().toISOString(),
      totalPublishedChapters: chapters.length,
      chapters,
    };
  }

  async getChapterOfflinePackage(chapterId: string) {
    const chapter =
      await this.uow.chapterPublicationRepository.getPublishedChapterForOffline(
        chapterId,
      );

    if (!chapter) {
      throw new NotFoundError("Bolum bulunamadi veya yayinda degil.");
    }

    return chapter;
  }

  async getOfflineChaptersPackage(novelId: string, chapterIds: string[]) {
    const novel = await this.uow.novelRepository.findOneById(novelId);

    if (!novel) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    const uniqueChapterIds = Array.from(new Set(chapterIds));
    const chapters =
      await this.uow.chapterPublicationRepository.getPublishedChaptersByIdsForDownload(
        novelId,
        uniqueChapterIds,
      );
    const returnedIds = new Set(chapters.map((chapter) => chapter.id));

    return {
      novel: {
        id: novel.id,
        name: novel.name,
        slug: novel.slug,
        coverImage: novel.coverImage ?? null,
        synopsis: novel.synopsis ?? null,
        status: novel.status,
        chapterCount: novel.chapterCount,
        lastChapterDate: novel.lastChapterDate ?? null,
        updatedAt: novel.updatedAt,
      },
      requestedChapterCount: uniqueChapterIds.length,
      returnedChapterCount: chapters.length,
      skippedChapterIds: uniqueChapterIds.filter((id) => !returnedIds.has(id)),
      generatedAt: new Date().toISOString(),
      chapters,
    };
  }

  async changePublicationStatus({
    chapterId,
    publicationStatus,
    authorId,
    isAdmin,
  }: {
    chapterId: string;
    publicationStatus: PublicationStatus;
    authorId: string;
    isAdmin: boolean;
  }) {
    const chapterMeta =
      await this.uow.chapterPublicationRepository.getChapterForMeta(chapterId);
    if (!chapterMeta) {
      throw new NotFoundError("Bolum bulunamadi veya yayinda degil.");
    }
    const isOwner = chapterMeta.authorId === authorId;
    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu bolume erisim izniniz yok.",
      );
    }
    await this.uow.chapterPublicationRepository.changePublicationStatus(
      chapterId,
      publicationStatus,
    );
  }
}
