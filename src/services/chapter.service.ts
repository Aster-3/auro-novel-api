import { IChapterService } from "../interfaces/chapter.service.interface.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { ConflictError } from "../errors/conflict.error.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";
import { PublicationStatus } from "../constants/chapter.constants.js";
import { truncateHtml } from "../utils/truncateHtml.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";
import {
  AuthorTransactionType,
  CoinType,
  Currency,
  ReaderTransactionType,
} from "../constants/transaction.contants.js";
import { calculateFinalAmount } from "../utils/calculateFinalAmount.js";

export class ChapterService implements IChapterService {
  constructor(private uow: IUnitOfWork) {}

  async createChapter(
    dto: CreateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void> {
    console.log(dto, authorId, isAdmin);
    const isOwner = await this.uow.novelRepository.isOwnerControl(
      dto.novelId,
      authorId,
    );
    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanın sahibi değilsiniz.",
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
      throw new NotFoundError("Bölüm bulunamadı veya zaten yayınlanmış.");
    }

    if (draft.novel.id !== dto.novelId) {
      throw new ConflictError("novel_id", "Geçersiz novel ID.");
    }
    console.log(dto, authorId, isAdmin);
    const isOwner = draft.novel?.author?.userId === authorId;

    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu romanın sahibi değilsiniz.",
      );
    }

    // işlemler

    if (!dto.volumeId) {
      const suggestedVolume =
        await this.uow.volumeRepository.findOldestEmptyOrLatestVolume(
          dto.novelId,
        );
      if (!suggestedVolume) {
        throw new ConflictError(
          "volumeId",
          "Bölüm eklemek için en az bir cilt oluşturmalısınız.",
        );
      }
      dto.volumeId = suggestedVolume.id;
    } else {
      const volume = await this.uow.volumeRepository.getOneById(dto.volumeId);

      if (!volume || volume.novelId !== dto.novelId) {
        throw new ConflictError("volumeId", "Geçersiz cilt ID.");
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
          "En fazla bir cilt atlanabilir. Lütfen önceki ciltleri doldurun.",
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
        "Bölüm sıralaması geçersiz. Mevcut son sıradan sonra gelmelidir.",
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
      await await this.uow.commit();
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
      throw new NotFoundError("Bölüm bulunamadı veya zaten yayınlanmış.");
    }

    if (!isAdmin && chapter.novel?.author?.userId !== authorId) {
      throw new ConflictError(
        "invalid_access",
        "Bu bölüme erişim izniniz yok.",
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
        "Bu bölüme erişim izniniz yok.",
      );
    }

    const isPurchased =
      await this.uow.chapterPurchaseRepository.isChapterEverPurchased(
        chapterId,
      );

    if (isPurchased) {
      throw new ConflictError(
        "chapterId",
        "Bu bölüm satın alındığı için silinemez.",
      );
    }

    const isPublished =
      await this.uow.chapterPublicationRepository.getChapterForMeta(chapterId);

    if (!isPublished) {
      return await this.uow.chapterRepository.deleteChapter(chapterId);
    }

    const hasOtherChaptersInVolume =
      await this.uow.chapterPublicationRepository.otherChaptersExistInVolume(
        chapterId,
        isPublished.volumeId,
      );

    console.log(
      "Bu bölümün cildinde başka bölümler var mı?",
      hasOtherChaptersInVolume,
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
          "Cilt boş bırakılamayacağı için bu bölüm silinemez.",
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
      console.log(
        "Bölüm başarıyla silindi, istatistikler güncellendi.",
        isPublished,
      );
      await this.uow.commit();
    } catch (error) {
      console.error("Bölüm silme işlemi sırasında hata oluştu:", error);
      await this.uow.rollback();
    } finally {
      await this.uow.release();
    }
  }

  async getChapterForReading(id: string, userId: string, isAdmin: boolean) {
    const data =
      await this.uow.chapterPublicationRepository.getChapterForReading(id);

    if (!data) {
      throw new NotFoundError("Bölüm mevcut değil.");
    }

    const {
      paywallStartVolume,
      paywallStartChapter,
      authorId,
      volumeOrder,
      chapterOrder,
      publicationStatus,
      content,
    } = data;

    const isOwner = authorId === userId;
    const [hasPurchased, nextChapter, previousChapterId, appConfig] =
      await Promise.all([
        this.uow.chapterPurchaseRepository.hasPurchasedChapterByUserId(
          userId,
          id,
        ),
        this.uow.chapterPublicationRepository.getNextChapter(
          data.novelId,
          chapterOrder,
          volumeOrder,
        ),
        this.uow.chapterPublicationRepository.getPreviousChapter(
          data.novelId,
          chapterOrder,
          volumeOrder,
        ),
        this.uow.appConfigRepository.getConfig(),
      ]);
    const privilegedUser = isAdmin || isOwner || hasPurchased;

    if (
      publicationStatus === PublicationStatus.UNPUBLISHED &&
      !privilegedUser
    ) {
      throw new ForbiddenError("Bu bölüm yayından kaldırılmıştır.");
    }

    let isLockedBySystem = volumeOrder === 0;
    if (
      paywallStartVolume !== null &&
      paywallStartChapter !== null &&
      !isLockedBySystem
    ) {
      isLockedBySystem =
        volumeOrder > paywallStartVolume ||
        (volumeOrder === paywallStartVolume &&
          chapterOrder >= paywallStartChapter);
    }

    const isLocked = isLockedBySystem && !privilegedUser;

    let finalContent = content;
    if (isLocked) {
      finalContent = truncateHtml(content, 75);
    }
    const finalAmount = calculateFinalAmount(
      {
        premiumPrice: data.premiumPrice!,
        freemiumPrice: data.freemiumPrice!,
        discountRate: data.discountRate,
        discountEndDate: data.discountEndDate,
      },
      {
        percent: appConfig.seasonSalePercent,
        endDate: appConfig.seasonSaleEndDate,
      },
      CoinType.MOON,
    );

    const isDiscountActive =
      finalAmount < data.premiumPrice! && data.discountEndDate! > new Date();

    return {
      id: data.id,
      title: data.title,
      content: finalContent,
      volumeOrder: data.volumeOrder,
      novelId: data.novelId,
      volumeTitle: data.volumeTitle,
      isLocked: isLocked,
      nextChapterId: nextChapter || null,
      previousChapterId: previousChapterId || null,
      novelStatus: data.novelStatus,
      isDiscountActive: isDiscountActive,
      premiumPrice: data.premiumPrice!,
      freemiumPrice: data.freemiumPrice!,
      discountedPremiumPrice: finalAmount,
      discountRate: data.discountRate!,
      discountEndDate: data.discountEndDate,
    };
  }

  async getOneDraftChapter(id: string, authorId: string, isAdmin: boolean) {
    const chapter = await this.uow.chapterRepository.getOneDraftChapterById(id);

    if (!chapter) {
      throw new NotFoundError("Bölüm bulunamadı veya zaten yayınlanmış.");
    }
    if (!isAdmin && chapter.novel?.author?.userId !== authorId) {
      throw new ConflictError(
        "invalid_access",
        "Bu bölüme erişim izniniz yok.",
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
      console.log("Kullanıcı ne admin ne de sahibi, erişim reddediliyor.");
      throw new ConflictError(
        "invalid_access",
        "Bu romanın sahibi değilsiniz.",
      );
    }

    const chapters =
      await this.uow.chapterRepository.getDraftChaptersByNovelId(dto);
    return chapters;
  }

  async getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ) {
    const chapters =
      await this.uow.chapterPublicationRepository.getChaptersByNovelId(
        dto,
        userId,
        isAdmin,
      );
    return chapters;
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
      throw new NotFoundError("Bölüm bulunamadı veya yayında değil.");
    }
    const isOwner = chapterMeta.authorId === authorId;
    if (!isAdmin && !isOwner) {
      throw new ConflictError(
        "invalid_access",
        "Bu bölüme erişim izniniz yok.",
      );
    }
    await this.uow.chapterPublicationRepository.changePublicationStatus(
      chapterId,
      publicationStatus,
    );
  }

  async purchaseChapter(dto: CreateChapterPurchaseDTO): Promise<void> {
    // await this.uow.readerWalletRepository.addCoins(
    //   dto.userId,
    //   dto.coinType,
    //   50,
    // );
    const chapter = await this.uow.chapterRepository.getChapterForPurchase(
      dto.id,
    );
    console.log("Satın alınmaya çalışılan bölüm:", chapter);
    // Erken

    if (!chapter) {
      throw new NotFoundError("Bölüm bulunamadı.");
    }

    if (dto.userId === chapter.userId) {
      throw new ConflictError(
        "invalid_purchase",
        "Kendi bölümünüzü satın alamazsınız.",
      );
    }

    if (chapter.isNovelBanned) {
      throw new ConflictError(
        "chapterId",
        "Kitap yasaklanmış olduğu için bu bölümü satın alamazsınız.",
      );
    }

    if (chapter.publicationStatus !== PublicationStatus.PUBLISHED) {
      throw new ConflictError("chapterId", "Bu bölüm satın alınamaz.");
    }

    const isPurchased =
      await this.uow.chapterPurchaseRepository.hasPurchasedChapterByUserId(
        dto.userId,
        dto.id,
      );

    if (isPurchased) {
      throw new ConflictError("chapterId", "Bu bölümü zaten satın aldınız.");
    }

    console.log(
      "Satın alma işlemi için gerekli kontroller tamamlandı, işleme devam ediliyor.",
    );

    // Nihai fiyatı hesaplamak için önce geçerli indirim oranını belirleyelim
    const config = await this.uow.appConfigRepository.getConfig();

    let amountToSubtract = calculateFinalAmount(
      {
        premiumPrice: chapter.premiumPrice,
        freemiumPrice: chapter.freemiumPrice,
        discountRate: chapter.discountRate,
        discountEndDate: chapter.discountEndDate,
      },
      {
        percent: config.seasonSalePercent,
        endDate: config.seasonSaleEndDate,
      },
      dto.coinType,
    );
    console.log(
      `Hesaplanan final fiyat: ${amountToSubtract} ${dto.coinType === CoinType.SUN ? "Güneş Parçası" : "Ay Parçası"}`,
    );

    await this.uow.startTransaction();

    try {
      // Bakiye Kontrolü

      const balance = await this.uow.readerWalletRepository.getBalance(
        dto.userId,
      );
      if (!balance) throw new ConflictError("balance", "Cüzdan bulunamadı.");
      console.log(
        "Bakiye kontrolü tamamlandı, satın alma işlemi gerçekleştiriliyor.",
        balance,
      );
      const currentBalance =
        dto.coinType === CoinType.SUN ? balance.sunCoins : balance.moonCoins;
      if (currentBalance < amountToSubtract) {
        const coinName =
          dto.coinType === CoinType.SUN ? "Güneş Parçası" : "Ay Parçası";
        throw new ConflictError("balance", `Yetersiz ${coinName}.`);
      }

      //  Alım işlemi

      await this.uow.readerWalletRepository.subtractCoins(
        dto.userId,
        dto.coinType,
        amountToSubtract,
      );

      const purchaseId =
        await this.uow.chapterPurchaseRepository.createChapterPurchase({
          chapterId: chapter.chapterId,
          userId: dto.userId,
          amount: amountToSubtract,
          coinType: dto.coinType,
        });

      // Transaction Log

      const chapterIdentifier = chapter.chapterTitle?.trim()
        ? chapter.chapterTitle
        : `Bölüm (ID: ${chapter.chapterId.slice(-4)})`;

      await this.uow.readerWalletTransactionRepository.createTransaction({
        walletId: balance.id,
        amount: amountToSubtract,
        coinType: dto.coinType,
        transactionType: ReaderTransactionType.PURCHASE,
        description: `${chapter.novelTitle}: ${chapterIdentifier} satın alındı`,
      });

      // 5. İstatistik: Satış sayısını artır
      await this.uow.novelRepository.incrementTotalSales(chapter.novelId);

      // --- KRİTİK AYRIM: YAZAR HAKEDİŞİ ---

      if (dto.coinType === CoinType.MOON) {
        const coinPrice = config.baseCoinPrice;

        const authorWallet =
          await this.uow.authorWalletRepository.getWalletByAuthorId(
            chapter.authorId!,
          );

        if (!authorWallet) {
          throw new NotFoundError("Yazar cüzdanı bulunamadı.");
        }

        // Moon Coin Hakedişi Hesaplama

        const grossAmount = amountToSubtract * coinPrice;

        const authorEarning = Math.floor(
          grossAmount * (chapter.authorSharePercent / 100),
        );

        const platformEarning = grossAmount - authorEarning;

        const earningId =
          await this.uow.authorEarningRepository.createEarningRecord({
            authorId: chapter.authorId!,
            novelId: chapter.novelId,
            chapterId: chapter.chapterId,
            purchaseId: purchaseId,
            coinAmount: amountToSubtract,
            coinUnitPrice: coinPrice,
            currency: Currency.TRY,
            grossAmount: grossAmount,
            authorSharePercent: chapter.authorSharePercent,
            platformCommissionAmount: platformEarning,
            netAmount: authorEarning,
          });

        const newBalance =
          await this.uow.authorWalletRepository.incrementTotalEarningsAndBalance(
            chapter.authorId!,
            authorEarning,
          );

        await this.uow.authorWalletTransactionRepository.createTransaction({
          walletId: authorWallet.id,
          transactionType: AuthorTransactionType.EARNING,
          amount: authorEarning,
          balanceBeforeTransaction: newBalance - authorEarning,
          balanceAfterTransaction: newBalance,
          description: `[${chapter.novelTitle}]: ${chapterIdentifier}`,
          referenceId: earningId,
        });

        await this.uow.platformEarningRepository.createEarningRecord({
          authorId: chapter.authorId!,
          novelId: chapter.novelId,
          chapterId: chapter.chapterId,
          purchaseId: purchaseId,
          grossAmount: grossAmount,
          platformCommissionRate: 100 - chapter.authorSharePercent,
          coinAmount: amountToSubtract,
          coinUnitPrice: coinPrice,
          currency: Currency.TRY,
          netAmount: platformEarning,
        });

        await this.uow.platformFinanceRepository.recordIncome(platformEarning);
      }
      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    } finally {
      await this.uow.release();
    }
  }
  async createChapter2(
    dto: CreateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ) {
    // async getOneChapter(id: string, userId: string) {
    //   const chapter = await this.chapterRepo.getOneChapter(id);
    //   if (!chapter) {
    //     throw new ConflictError("no_chapter", "Böyle bir bölüm mevcut değil.");
    //   }
    //   const isPrequel = chapter.volume.orderIndex === 0;
    //   const isAfterPaywall =
    //     chapter.volume.orderIndex > chapter.novel.paywallStartVolume ||
    //     (chapter.volume.orderIndex === chapter.novel.paywallStartVolume &&
    //       chapter.orderIndex >= chapter.novel.paywallStartChapter);
    //   const isLockedBySystem = isPrequel || isAfterPaywall;
    //   const isOwner = chapter.novel?.author?.userId === userId;
    //   const hasPurchased = chapter.purchases?.some((p) => p.userId === userId);
    //   const isUnlocked = !isLockedBySystem || isOwner || hasPurchased;
    //   if (!isUnlocked) {
    //     throw new ForbiddenError(
    //       "Bu bölüme erişim izniniz yok. Lütfen satın alın veya aboneliğinizi kontrol edin.",
    //     );
    //   }
    //   return {
    //     id: chapter.id,
    //     title: chapter.title,
    //     content: chapter.content, // Artık güvenle içeriği dönebiliriz
    //     chapterOrder: chapter.orderIndex,
    //     volumeOrder: chapter.volume.orderIndex,
    //     volumeId: chapter.volume.id,
    //   };
    // }
    // async create(dto: CreateChapterDTO, isAdmin: boolean, authorId: string) {
    //   const isOwner = await this.novelRepo.isOwnerControl(dto.novelId, authorId);
    //   if (!isAdmin && !isOwner) {
    //     throw new ConflictError(
    //       "invalid_access",
    //       "Bu romanın sahibi değilsiniz.",
    //     );
    //   }
    //   if (!dto.volumeId) {
    //     const suggestedVolume =
    //       await this.volumeRepo.findOldestEmptyOrLatestVolume(dto.novelId);
    //     if (!suggestedVolume) {
    //       dto.volumeId = await this.volumeRepo.create({
    //         novelId: dto.novelId,
    //         orderIndex: 1,
    //         name: null,
    //       });
    //     } else {
    //       dto.volumeId = suggestedVolume.id;
    //     }
    //   } else {
    //     const availableVolume = await this.volumeRepo.getOneById(dto.volumeId);
    //     if (!availableVolume || availableVolume.novelId !== dto.novelId) {
    //       throw new ConflictError("volumeId", "Geçersiz cilt.");
    //     }
    //     if (!isAdmin) {
    //       const hasEmptyPrev = await this.volumeRepo.hasAnyEmptyPreviousVolume(
    //         dto.novelId,
    //         availableVolume.orderIndex,
    //       );
    //       if (hasEmptyPrev) {
    //         throw new ConflictError(
    //           "volume_order",
    //           "Aradaki boş ciltleri doldurmalısınız.",
    //         );
    //       }
    //     }
    //   }
    //   let finalOrder: number;
    //   if (isAdmin && dto.orderIndex !== undefined && dto.orderIndex !== null) {
    //     finalOrder = dto.orderIndex;
    //     const exists = await this.chapterRepo.duplicateControl(
    //       dto.volumeId,
    //       finalOrder,
    //     );
    //     if (exists)
    //       throw new ConflictError("order", `${finalOrder} zaten mevcut.`);
    //   } else {
    //     const lastChapter = await this.chapterRepo.getLastChapterInVolume(
    //       dto.novelId,
    //       dto.volumeId,
    //     );
    //     const currentMax = Math.floor(lastChapter?.orderIndex ?? 0);
    //     finalOrder = currentMax + 1;
    //   }
    //   return await this.chapterRepo.create({
    //     ...dto,
    //     orderIndex: finalOrder,
    //   });
    // }
    // async delete(id: string, userId: string) {
    //   const chapter = await this.chapterRepo.getShortInfoById(id);
    //   if (!chapter) throw new ConflictError("id", "Bölüm bulunamadı.");
    //   const isOwner = chapter.novel?.author?.userId === userId;
    //   if (!isOwner) throw new ForbiddenError("Yetkiniz yok.");
    //   const isPurchased = await this.chapterRepo.isPurchased(id);
    //   if (isPurchased) {
    //     throw new ConflictError(
    //       "chapter_purchased",
    //       "Satın alınmış bölümler silinemez.",
    //     );
    //   }
    //   // if (chapter.isPublished) {
    //   //   const hasAfterInVolume = await this.chapterRepo.hasPublishedAfterInVolume(
    //   //     chapter.volumeId,
    //   //     chapter.orderIndex,
    //   //   );
    //   //   const hasInNextVolumes = await this.volumeRepo.hasPublishedInNextVolumes(
    //   //     chapter.novelId,
    //   //     chapter.volume.orderIndex,
    //   //   );
    //   //   if (hasAfterInVolume || hasInNextVolumes) {
    //   //     throw new ConflictError(
    //   //       "published_after",
    //   //       "Yayında olan bir cilt boş bırakılamaz.",
    //   //     );
    //   //   }
    //   // }
    //   // const hasOtherChaptersInVolume =
    //   //   await this.chapterRepo.hasOtherChaptersInVolume(
    //   //     chapter.id,
    //   //     chapter.volumeId,
    //   //   );
    //   // console.log("hasOtherChaptersInVolume:", hasOtherChaptersInVolume);
    //   // if (!hasOtherChaptersInVolume) {
    //   //   const hasNotEmptyNextVolume = await this.volumeRepo.hasAnyNextVolume(
    //   //     chapter.novelId,
    //   //     chapter.volume.orderIndex,
    //   //   );
    //   //   if (hasNotEmptyNextVolume) {
    //   //     throw new ConflictError(
    //   //       "last_chapter_in_volume",
    //   //       "Bu bölümü silebilmek için önce sonraki ciltlerdeki bölümleri silmelisiniz.",
    //   //     );
    //   //   } else {
    //   //     console.log("buraya girdi");
    //   //     throw new ConflictError(
    //   //       "last_chapter_in_volume",
    //   //       "Bir ciltte en az bir bölüm bulunmalıdır.",
    //   //     );
    //   //   }
    //   // }
    //   await this.chapterRepo.delete(id);
    //   await this.chapterRepo.closeGapInVolume(
    //     chapter.volumeId,
    //     chapter.orderIndex,
    //   );
    //   await this.novelRepo.refreshChapterStats(chapter.novelId);
    // }
    // async updateChapter(
    //   dto: UpdateChapterDTO,
    //   authorId: string,
    //   isAdmin: boolean,
    // ) {
    //   const chapter = await this.chapterRepo.getShortInfoById(dto.id);
    //   if (!chapter) throw new ConflictError("id", "Bölüm bulunamadı.");
    //   const isOwner = chapter.novel?.author?.userId === authorId;
    //   if (!isAdmin && !isOwner) throw new ForbiddenError("Yetkiniz yok.");
    //   const oldVolumeId = chapter.volumeId;
    //   const oldOrderIndex = chapter.orderIndex;
    //   const isMovingToAnotherVolume = !!(
    //     dto.volumeId && dto.volumeId !== oldVolumeId
    //   );
    //   const finalPublishState =
    //     dto.isPublished !== undefined ? dto.isPublished : chapter.isPublished;
    //   /**
    //    */
    //   if (
    //     chapter.isPublished &&
    //     (dto.isPublished === false || isMovingToAnotherVolume)
    //   ) {
    //     const hasPublishedAfter =
    //       await this.chapterRepo.hasPublishedAfterInVolume(
    //         oldVolumeId,
    //         oldOrderIndex,
    //       );
    //     if (hasPublishedAfter) {
    //       const errorMsg = isMovingToAnotherVolume
    //         ? "Bu bölümü taşımak için önce bu ciltteki sonraki bölümleri yayından kaldırmalısınız."
    //         : "Bu bölümü yayından kaldırmak için sonraki bölümleri yayından kaldırmalısınız.";
    //       throw new ConflictError("orderIndex", errorMsg);
    //     }
    //     const hasOtherPublished =
    //       await this.chapterRepo.hasOtherPublishedInVolume(
    //         chapter.id,
    //         oldVolumeId,
    //       );
    //     if (!hasOtherPublished) {
    //       const hasNextVolumes = await this.volumeRepo.hasPublishedInNextVolumes(
    //         chapter.novelId,
    //         chapter.volume.orderIndex,
    //       );
    //       if (hasNextVolumes) {
    //         throw new ConflictError(
    //           "publish_order",
    //           "Yayında olan bir cilt boş bırakılamaz.",
    //         );
    //       }
    //     }
    //   }
    //   if (isMovingToAnotherVolume) {
    //     const targetVolume = await this.volumeRepo.getOneById(dto.volumeId!);
    //     if (!targetVolume) throw new ConflictError("volumeId", "Geçersiz cilt.");
    //     // Boş cilt atlama kontrolü
    //     const hasEmptyPrev = await this.volumeRepo.hasAnyEmptyPreviousVolume(
    //       chapter.novelId,
    //       targetVolume.orderIndex,
    //     );
    //     if (hasEmptyPrev) {
    //       throw new ConflictError(
    //         "volume_order",
    //         "Aradaki boş ciltleri doldurmalısınız.",
    //       );
    //     }
    //     const hasOtherChaptersInVolume =
    //       await this.chapterRepo.hasOtherChaptersInVolume(
    //         chapter.id,
    //         chapter.volumeId,
    //       );
    //     if (!hasOtherChaptersInVolume) {
    //       throw new ConflictError(
    //         "last_chapter_in_volume",
    //         "Bir ciltte en az bir bölüm bulunmalıdır.",
    //       );
    //     }
    //     const maxOrder = await this.chapterRepo.getMaxOrderIndexInVolume(
    //       dto.volumeId!,
    //     );
    //     dto.orderIndex = (maxOrder || 0) + 1;
    //   }
    //   /**
    //    * 3. YAYINLAMA (PUBLISH) KONTROLLERİ
    //    */
    //   if (dto.isPublished === true) {
    //     if (chapter.publishedAt === null) {
    //       dto.publishedAt = new Date();
    //     }
    //     // Önceki ciltlerin yayınlanma durumu (Boş cilt kontrolü)
    //     const currentVolumeOrder = isMovingToAnotherVolume
    //       ? (await this.volumeRepo.getOneById(dto.volumeId!))?.orderIndex
    //       : chapter.volume.orderIndex;
    //     const isAcceptablePublish =
    //       await this.volumeRepo.hasUnpublishedPreviousVolume(
    //         chapter.novelId,
    //         currentVolumeOrder || 0,
    //       );
    //     if (isAcceptablePublish) {
    //       throw new ConflictError(
    //         "publish_order",
    //         "Önceki ciltleri yayınlamalısınız.",
    //       );
    //     }
    //     // Cilt içi sıralı yayınlama kontrolü
    //     const targetVolId = dto.volumeId || oldVolumeId;
    //     const lastPublishedIndex =
    //       await this.chapterRepo.getLastPublishedChapterIndexInVolume(
    //         targetVolId,
    //       );
    //     // Eğer taşınıyorsa yeni orderIndex'e, taşınmıyorsa mevcuda bakılır
    //     const orderToCheck = dto.orderIndex || oldOrderIndex;
    //     if (orderToCheck > (lastPublishedIndex || 0) + 1) {
    //       throw new ConflictError(
    //         "orderIndex",
    //         "Önceki bölümleri yayınlamalısınız.",
    //       );
    //     }
    //   }
    //   // Veritabanı Güncelleme
    //   await this.chapterRepo.updateChapter(dto);
    //   // İstatistik Yenileme
    //   if (dto.isPublished !== undefined) {
    //     await this.novelRepo.refreshChapterStats(chapter.novelId);
    //   }
    //   // Eski Ciltteki Sıralama Boşluğunu Kapat (Sadece taşıma olduysa)
    //   if (isMovingToAnotherVolume) {
    //     await this.chapterRepo.closeGapInVolume(oldVolumeId, oldOrderIndex);
    //   }
    // }
  }
}
