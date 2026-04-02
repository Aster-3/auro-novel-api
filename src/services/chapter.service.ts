import { ConflictError } from "../errors/conflict.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { IChapterService } from "../interfaces/chapter.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IVolumeRepository } from "../interfaces/volume.repo.interface.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

export class ChapterService implements IChapterService {
  constructor(
    private chapterRepo: IChapterRepository,
    private volumeRepo: IVolumeRepository,
    private novelRepo: INovelRepository,
  ) {}

  async getOneChapter(id: string, userId: string) {
    const chapter = await this.chapterRepo.getOneChapter(id);

    if (!chapter) {
      throw new ConflictError("no_chapter", "Böyle bir bölüm mevcut değil.");
    }

    const isPrequel = chapter.volume.orderIndex === 0;
    const isAfterPaywall =
      chapter.volume.orderIndex > chapter.novel.paywallStartVolume ||
      (chapter.volume.orderIndex === chapter.novel.paywallStartVolume &&
        chapter.orderIndex >= chapter.novel.paywallStartChapter);

    const isLockedBySystem = isPrequel || isAfterPaywall;

    const isOwner = chapter.novel?.author?.userId === userId;
    const hasPurchased = chapter.purchases?.some((p) => p.userId === userId);

    const isUnlocked = !isLockedBySystem || isOwner || hasPurchased;

    if (!isUnlocked) {
      throw new ForbiddenError(
        "Bu bölüme erişim izniniz yok. Lütfen satın alın veya aboneliğinizi kontrol edin.",
      );
    }
    return {
      id: chapter.id,
      title: chapter.title,
      content: chapter.content, // Artık güvenle içeriği dönebiliriz
      chapterOrder: chapter.orderIndex,
      volumeOrder: chapter.volume.orderIndex,
      volumeId: chapter.volume.id,
    };
  }

  async create(dto: CreateChapterDTO, isAdmin: boolean, authorId: string) {
    const isOwner = await this.novelRepo.isOwnerControl(dto.novelId, authorId);
    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanın sahibi değilsiniz.",
      );
    }

    if (!dto.volumeId) {
      const suggestedVolume =
        await this.volumeRepo.findOldestEmptyOrLatestVolume(dto.novelId);
      if (!suggestedVolume) {
        dto.volumeId = await this.volumeRepo.create({
          novelId: dto.novelId,
          orderIndex: 1,
          name: null,
        });
      } else {
        dto.volumeId = suggestedVolume.id;
      }
    } else {
      const availableVolume = await this.volumeRepo.getOneById(dto.volumeId);

      if (!availableVolume || availableVolume.novelId !== dto.novelId) {
        throw new ConflictError("volumeId", "Geçersiz cilt.");
      }

      if (!isAdmin) {
        const hasEmptyPrev = await this.volumeRepo.hasAnyEmptyPreviousVolume(
          dto.novelId,
          availableVolume.orderIndex,
        );
        if (hasEmptyPrev) {
          throw new ConflictError(
            "volume_order",
            "Aradaki boş ciltleri doldurmalısınız.",
          );
        }
      }
    }

    let finalOrder: number;

    if (isAdmin && dto.orderIndex !== undefined && dto.orderIndex !== null) {
      finalOrder = dto.orderIndex;

      const exists = await this.chapterRepo.duplicateControl(
        dto.volumeId,
        finalOrder,
      );
      if (exists)
        throw new ConflictError("order", `${finalOrder} zaten mevcut.`);
    } else {
      const lastChapter = await this.chapterRepo.getLastChapterInVolume(
        dto.novelId,
        dto.volumeId,
      );

      const currentMax = Math.floor(lastChapter?.orderIndex ?? 0);
      finalOrder = currentMax + 1;
    }

    return await this.chapterRepo.create({
      ...dto,
      orderIndex: finalOrder,
    });
  }

  async delete(id: string, userId: string) {
    const chapter = await this.chapterRepo.getShortInfoById(id);
    if (!chapter) throw new ConflictError("id", "Bölüm bulunamadı.");

    const isOwner = chapter.novel?.author?.userId === userId;
    if (!isOwner) throw new ForbiddenError("Yetkiniz yok.");

    const isPurchased = await this.chapterRepo.isPurchased(id);
    if (isPurchased) {
      throw new ConflictError(
        "chapter_purchased",
        "Satın alınmış bölümler silinemez.",
      );
    }

    // if (chapter.isPublished) {
    //   const hasAfterInVolume = await this.chapterRepo.hasPublishedAfterInVolume(
    //     chapter.volumeId,
    //     chapter.orderIndex,
    //   );

    //   const hasInNextVolumes = await this.volumeRepo.hasPublishedInNextVolumes(
    //     chapter.novelId,
    //     chapter.volume.orderIndex,
    //   );

    //   if (hasAfterInVolume || hasInNextVolumes) {
    //     throw new ConflictError(
    //       "published_after",
    //       "Yayında olan bir cilt boş bırakılamaz.",
    //     );
    //   }
    // }

    // const hasOtherChaptersInVolume =
    //   await this.chapterRepo.hasOtherChaptersInVolume(
    //     chapter.id,
    //     chapter.volumeId,
    //   );

    // console.log("hasOtherChaptersInVolume:", hasOtherChaptersInVolume);

    // if (!hasOtherChaptersInVolume) {
    //   const hasNotEmptyNextVolume = await this.volumeRepo.hasAnyNextVolume(
    //     chapter.novelId,
    //     chapter.volume.orderIndex,
    //   );
    //   if (hasNotEmptyNextVolume) {
    //     throw new ConflictError(
    //       "last_chapter_in_volume",
    //       "Bu bölümü silebilmek için önce sonraki ciltlerdeki bölümleri silmelisiniz.",
    //     );
    //   } else {
    //     console.log("buraya girdi");
    //     throw new ConflictError(
    //       "last_chapter_in_volume",
    //       "Bir ciltte en az bir bölüm bulunmalıdır.",
    //     );
    //   }
    // }

    await this.chapterRepo.delete(id);

    await this.chapterRepo.closeGapInVolume(
      chapter.volumeId,
      chapter.orderIndex,
    );
    await this.novelRepo.refreshChapterStats(chapter.novelId);
  }

  async updateChapter(
    dto: UpdateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ) {
    const chapter = await this.chapterRepo.getShortInfoById(dto.id);
    if (!chapter) throw new ConflictError("id", "Bölüm bulunamadı.");

    const isOwner = chapter.novel?.author?.userId === authorId;
    if (!isAdmin && !isOwner) throw new ForbiddenError("Yetkiniz yok.");

    const oldVolumeId = chapter.volumeId;
    const oldOrderIndex = chapter.orderIndex;
    const isMovingToAnotherVolume = !!(
      dto.volumeId && dto.volumeId !== oldVolumeId
    );

    const finalPublishState =
      dto.isPublished !== undefined ? dto.isPublished : chapter.isPublished;

    /**
     */
    if (
      chapter.isPublished &&
      (dto.isPublished === false || isMovingToAnotherVolume)
    ) {
      const hasPublishedAfter =
        await this.chapterRepo.hasPublishedAfterInVolume(
          oldVolumeId,
          oldOrderIndex,
        );

      if (hasPublishedAfter) {
        const errorMsg = isMovingToAnotherVolume
          ? "Bu bölümü taşımak için önce bu ciltteki sonraki bölümleri yayından kaldırmalısınız."
          : "Bu bölümü yayından kaldırmak için sonraki bölümleri yayından kaldırmalısınız.";
        throw new ConflictError("orderIndex", errorMsg);
      }

      const hasOtherPublished =
        await this.chapterRepo.hasOtherPublishedInVolume(
          chapter.id,
          oldVolumeId,
        );

      if (!hasOtherPublished) {
        const hasNextVolumes = await this.volumeRepo.hasPublishedInNextVolumes(
          chapter.novelId,
          chapter.volume.orderIndex,
        );

        if (hasNextVolumes) {
          throw new ConflictError(
            "publish_order",
            "Yayında olan bir cilt boş bırakılamaz.",
          );
        }
      }
    }

    if (isMovingToAnotherVolume) {
      const targetVolume = await this.volumeRepo.getOneById(dto.volumeId!);
      if (!targetVolume) throw new ConflictError("volumeId", "Geçersiz cilt.");

      // Boş cilt atlama kontrolü
      const hasEmptyPrev = await this.volumeRepo.hasAnyEmptyPreviousVolume(
        chapter.novelId,
        targetVolume.orderIndex,
      );

      if (hasEmptyPrev) {
        throw new ConflictError(
          "volume_order",
          "Aradaki boş ciltleri doldurmalısınız.",
        );
      }

      const hasOtherChaptersInVolume =
        await this.chapterRepo.hasOtherChaptersInVolume(
          chapter.id,
          chapter.volumeId,
        );

      if (!hasOtherChaptersInVolume) {
        throw new ConflictError(
          "last_chapter_in_volume",
          "Bir ciltte en az bir bölüm bulunmalıdır.",
        );
      }

      const maxOrder = await this.chapterRepo.getMaxOrderIndexInVolume(
        dto.volumeId!,
      );
      dto.orderIndex = (maxOrder || 0) + 1;
    }

    /**
     * 3. YAYINLAMA (PUBLISH) KONTROLLERİ
     */
    if (dto.isPublished === true) {
      if (chapter.publishedAt === null) {
        dto.publishedAt = new Date();
      }

      // Önceki ciltlerin yayınlanma durumu (Boş cilt kontrolü)
      const currentVolumeOrder = isMovingToAnotherVolume
        ? (await this.volumeRepo.getOneById(dto.volumeId!))?.orderIndex
        : chapter.volume.orderIndex;

      const isAcceptablePublish =
        await this.volumeRepo.hasUnpublishedPreviousVolume(
          chapter.novelId,
          currentVolumeOrder || 0,
        );

      if (isAcceptablePublish) {
        throw new ConflictError(
          "publish_order",
          "Önceki ciltleri yayınlamalısınız.",
        );
      }

      // Cilt içi sıralı yayınlama kontrolü
      const targetVolId = dto.volumeId || oldVolumeId;
      const lastPublishedIndex =
        await this.chapterRepo.getLastPublishedChapterIndexInVolume(
          targetVolId,
        );

      // Eğer taşınıyorsa yeni orderIndex'e, taşınmıyorsa mevcuda bakılır
      const orderToCheck = dto.orderIndex || oldOrderIndex;

      if (orderToCheck > (lastPublishedIndex || 0) + 1) {
        throw new ConflictError(
          "orderIndex",
          "Önceki bölümleri yayınlamalısınız.",
        );
      }
    }

    // Veritabanı Güncelleme
    await this.chapterRepo.updateChapter(dto);

    // İstatistik Yenileme
    if (dto.isPublished !== undefined) {
      await this.novelRepo.refreshChapterStats(chapter.novelId);
    }

    // Eski Ciltteki Sıralama Boşluğunu Kapat (Sadece taşıma olduysa)
    if (isMovingToAnotherVolume) {
      await this.chapterRepo.closeGapInVolume(oldVolumeId, oldOrderIndex);
    }
  }

  async getSummary(novelId: string) {
    return await this.chapterRepo.getSummary(novelId);
  }
}
