import { PublicationStatus } from "../constants/chapter.constants.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { Chapter } from "../entities/Chapter.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";
import { CreateChapterDTO } from "../schemas/create.chapter.schema.js";
import { GetChaptersDto } from "../schemas/get.chapters.schema.js";
import { CreatePublicationDTO } from "../schemas/publish.chapter.schema.js";
import { UpdateChapterDTO } from "../schemas/update.chapter.schema.js";

export interface IChapterService {
  createChapter(
    dto: CreateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  publishChapter(
    dto: CreatePublicationDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  updateChapter(
    dto: UpdateChapterDTO,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  deleteChapter(
    chapterId: string,
    authorId: string,
    isAdmin: boolean,
  ): Promise<void>;

  changePublicationStatus({
    chapterId,
    publicationStatus,
    authorId,
    isAdmin,
  }: {
    chapterId: string;
    publicationStatus: PublicationStatus;
    authorId: string;
    isAdmin: boolean;
  }): Promise<void>;

  getChapterForReading(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<{
    id: string;
    title: string;
    content: string;
    isLocked: boolean;
    nextChapterId: string | null;
    previousChapterId: string | null;
    isDiscountActive: boolean;
    premiumPrice: number;
    freemiumPrice: number;
    discountedPremiumPrice: number;
    discountRate: number;
    discountEndDate: Date | null;
    novelStatus: string;
  }>;
  getOneDraftChapter(
    id: string,
    authorId: string,
    isAdmin: boolean,
  ): Promise<Chapter | null>;

  getDraftChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<FindAndCountType<Chapter>>;

  getChaptersByNovelId(
    dto: GetChaptersDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<
    FindAndCountType<{
      id: string;
      title: string;
      chapterOrder: number;
      volumeOrder: number;
      volumeName: string | null;
      volumeId: string;
      isLocked: boolean;
      createdAt: Date;
      isUnpublished?: boolean;
    }>
  >;
  purchaseChapter(dto: CreateChapterPurchaseDTO): Promise<void>;
}
