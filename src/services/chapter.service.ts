import { ConflictError } from "../errors/conflict.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IChapterService } from "../interfaces/chapter.service.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { MoveChapterDTO } from "../schemas/move.chapter.schema.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

const SORT_KEY_STEP = 1000;
const MIN_SORT_GAP = 1;

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
    this.ensureLoadedNovelCanBeModified(draft.novel);

    const volumeId = await this.resolvePublishVolumeId(dto);
    const lastSortKey =
      await this.uow.chapterPublicationRepository.getLastSortKeyInVolume(
        volumeId,
      );

    await this.uow.startTransaction();
    try {
      await this.uow.chapterPublicationRepository.create({
        chapterId: dto.id,
        volumeId,
        sortKey: lastSortKey + SORT_KEY_STEP,
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

  private async resolvePublishVolumeId(dto: CreatePublicationDTO) {
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
      return suggestedVolume.id;
    }

    const volume = await this.uow.volumeRepository.getOneById(dto.volumeId);

    if (!volume || volume.novelId !== dto.novelId) {
      throw new ConflictError("volumeId", "Gecersiz cilt ID.");
    }

    const hasEmptyPrevious =
      await this.uow.volumeRepository.hasAnyEmptyPreviousVolume(
        dto.novelId,
        volume.orderIndex,
      );

    if (hasEmptyPrevious) {
      throw new ConflictError(
        "volumeId",
        "Ilk bos cilt atlanamaz. Lutfen onceki ciltleri doldurun.",
      );
    }

    return volume.id;
  }

  async moveChapter(
    dto: MoveChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const chapterMeta =
      await this.uow.chapterPublicationRepository.getChapterForMeta(dto.id);

    if (!chapterMeta) {
      throw new NotFoundError("Bolum bulunamadi veya henuz yayinlanmamis.");
    }

    if (!isAdmin && chapterMeta.authorId !== authorId) {
      throw new ConflictError(
        "invalid_access",
        "Bu bolume erisim izniniz yok.",
      );
    }
    await this.ensureNovelCanBeModified(chapterMeta.novelId, authorId, isAdmin);

    const targetVolumeId = dto.targetVolumeId ?? chapterMeta.volumeId;
    const targetVolume = await this.uow.volumeRepository.getOneById(
      targetVolumeId,
    );

    if (!targetVolume || targetVolume.novelId !== chapterMeta.novelId) {
      throw new ConflictError("targetVolumeId", "Gecersiz hedef cilt ID.");
    }

    await this.ensureMoveKeepsVolumeContinuity(chapterMeta, targetVolume);
    const sortKey = await this.calculateSortKeyForPlacement(
      targetVolumeId,
      dto.placement,
      dto.id,
    );

    await this.uow.startTransaction();
    try {
      await this.uow.chapterPublicationRepository.updatePlacement(
        dto.id,
        targetVolumeId,
        sortKey,
      );
      await this.uow.novelRepository.refreshChapterStats(chapterMeta.novelId);
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  }

  private async ensureMoveKeepsVolumeContinuity(
    chapterMeta: { id: string; volumeId: string; volumeOrder: number; novelId: string },
    targetVolume: { id: string; orderIndex: number; novelId: string },
  ) {
    const hasEmptyPreviousTarget =
      await this.uow.volumeRepository.hasAnyEmptyPreviousVolume(
        chapterMeta.novelId,
        targetVolume.orderIndex,
      );

    if (hasEmptyPreviousTarget) {
      throw new ConflictError(
        "targetVolumeId",
        "Dolu ciltler arasinda bos cilt birakilamaz.",
      );
    }

    if (targetVolume.id === chapterMeta.volumeId) return;

    const hasOtherChaptersInSource =
      await this.uow.chapterPublicationRepository.otherChaptersExistInVolume(
        chapterMeta.id,
        chapterMeta.volumeId,
      );

    if (hasOtherChaptersInSource) return;

    const sourceIsLastPopulated =
      !(await this.uow.volumeRepository.hasPopulatedVolumeAfter(
        chapterMeta.novelId,
        chapterMeta.volumeOrder,
      ));

    if (!sourceIsLastPopulated || targetVolume.orderIndex > chapterMeta.volumeOrder) {
      throw new ConflictError(
        "targetVolumeId",
        "Dolu ciltler arasinda bos cilt birakilamaz.",
      );
    }
  }

  private async calculateSortKeyForPlacement(
    volumeId: string,
    placement: MoveChapterDTO["placement"],
    movingChapterId: string,
    rebalanced = false,
  ): Promise<number> {
    let previous: number | null = null;
    let next: number | null = null;

    if (placement.type === "start") {
      next = await this.uow.chapterPublicationRepository.getFirstSortKeyInVolume(
        volumeId,
        movingChapterId,
      );
    } else if (placement.type === "end") {
      previous =
        await this.uow.chapterPublicationRepository.getLastSortKeyInVolume(
          volumeId,
          movingChapterId,
        );
    } else {
      if (placement.chapterId === movingChapterId) {
        throw new ConflictError(
          "placement",
          "Bolum kendi konumuna gore tasinamaz.",
        );
      }

      const anchorSortKey =
        await this.uow.chapterPublicationRepository.getSortKeyByChapterIdInVolume(
          placement.chapterId,
          volumeId,
        );

      if (anchorSortKey === null) {
        throw new ConflictError(
          "placement.chapterId",
          "Referans bolum hedef ciltte bulunamadi.",
        );
      }

      if (placement.type === "before") {
        previous =
          await this.uow.chapterPublicationRepository.getPreviousSortKeyInVolume(
            volumeId,
            anchorSortKey,
            movingChapterId,
          );
        next = anchorSortKey;
      } else {
        previous = anchorSortKey;
        next = await this.uow.chapterPublicationRepository.getNextSortKeyInVolume(
          volumeId,
          anchorSortKey,
          movingChapterId,
        );
      }
    }

    if (previous === null && next === null) return SORT_KEY_STEP;
    if (previous === null) return next! / 2;
    if (next === null) return previous + SORT_KEY_STEP;

    if (next - previous < MIN_SORT_GAP && !rebalanced) {
      await this.uow.chapterPublicationRepository.rebalanceVolume(volumeId);
      return this.calculateSortKeyForPlacement(
        volumeId,
        placement,
        movingChapterId,
        true,
      );
    }

    return (previous + next) / 2;
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
    this.ensureLoadedNovelCanBeModified(chapter.novel);

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

    const publicationMeta =
      await this.uow.chapterPublicationRepository.getChapterForMeta(chapterId);

    if (!publicationMeta) {
      const draft = await this.uow.chapterRepository.getOneDraftChapterById(
        chapterId,
      );
      if (!draft) {
        throw new NotFoundError("Bolum bulunamadi.");
      }
      this.ensureLoadedNovelCanBeModified(draft.novel);
      await this.uow.chapterRepository.deleteChapter(chapterId);
      return;
    }
    await this.ensureNovelCanBeModified(publicationMeta.novelId, authorId, isAdmin);

    const hasOtherChaptersInVolume =
      await this.uow.chapterPublicationRepository.otherChaptersExistInVolume(
        chapterId,
        publicationMeta.volumeId,
      );

    if (!hasOtherChaptersInVolume) {
      const hasPopulatedVolumeAfter =
        await this.uow.volumeRepository.hasPopulatedVolumeAfter(
          publicationMeta.novelId,
          publicationMeta.volumeOrder,
        );

      if (hasPopulatedVolumeAfter) {
        throw new ConflictError(
          "chapterId",
          "Dolu ciltler arasinda bos cilt birakilamaz.",
        );
      }
    }

    await this.uow.startTransaction();
    try {
      await this.uow.chapterRepository.deleteChapter(chapterId);
      await this.uow.novelRepository.refreshChapterStats(publicationMeta.novelId);
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
      await this.uow.chapterPublicationRepository.getChapterForReading(
        id,
        userId,
        isAdmin,
      );

    if (!data) {
      throw new NotFoundError("Bolum mevcut degil.");
    }

    const [nextChapter, previousChapterId] = await Promise.all([
      this.uow.chapterPublicationRepository.getNextChapter(
        data.novelId,
        data.sortKey,
        data.volumeOrder,
      ),
      this.uow.chapterPublicationRepository.getPreviousChapter(
        data.novelId,
        data.sortKey,
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

  private async ensureNovelCanBeModified(
    novelId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const novel = await this.uow.novelRepository.findOneById(
      novelId,
      undefined,
      { includeBanned: true },
    );

    if (!novel) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    if (!isAdmin && novel.author?.userId !== userId) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanin sahibi degilsiniz.",
      );
    }

    this.ensureLoadedNovelCanBeModified(novel);
  }

  private ensureLoadedNovelCanBeModified(
    novel: { bannedUntil?: Date | null } | null | undefined,
  ) {
    if (novel?.bannedUntil && novel.bannedUntil > new Date()) {
      throw new ForbiddenError("Banli roman uzerinde islem yapilamaz.");
    }
  }
}
