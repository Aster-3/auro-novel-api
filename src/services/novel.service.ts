import { FindOptionsWhere, ILike, Like } from "typeorm";
import { Novel } from "../entities/Novel.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { INovelService } from "../interfaces/novel.service.interface.js";
import { CreateNovelDTo } from "../schemas/create.novel.schema.js";
import { ConflictError } from "../errors/conflict.error.js";
import { GetNovelsDTo } from "../schemas/get.novels.schema.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { UpdateNovelDTO } from "../schemas/update.novel.schema.js";
import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { uploadToS3 } from "./s3.service.js";

export class NovelService implements INovelService {
  constructor(
    private novelRepo: INovelRepository,
    private authorRepo: IAuthorRepository,
  ) {}

  async create(dto: CreateNovelDTo, file?: Express.Multer.File) {
    const isSlugTaken = await this.novelRepo.existControl({ slug: dto.slug });
    if (isSlugTaken)
      throw new ConflictError("slug", "Bu slug zaten kullanımda.");

    const novelData = { ...dto };

    if (dto.authorId) {
      // Admin tarafından novel oluşturulurken authorId sağlanabilir, bu yüzden kontrol ediyoruz
      let author = await this.authorRepo.findByUserId(dto.authorId);

      if (!author) {
        console.log("Yazar bulunamadı, oluşturuluyor:", dto.authorId);
        const newAuthorId = await this.authorRepo.create({
          userId: dto.authorId,
        });
        novelData.authorId = newAuthorId;
      } else {
        novelData.authorId = author.id;
      }
    }

    if (file) {
      const fileUrl = await uploadToS3(file, "novel-covers");
      novelData.coverImage = fileUrl;
    }

    return this.novelRepo.create(novelData);
  }

  async getNovels(dto: GetNovelsDTo) {
    return this.novelRepo.getNovels(dto);
  }

  async getNovelDetailWithId(id: string) {
    const novel = await this.novelRepo.findOneById(id);
    if (!novel) throw new NotFoundError("Aradığınız novel bulunamadı.");
    const recommendationRate =
      novel.totalReviewsCount > 0
        ? Math.round(
            (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
          )
        : null;
    return { ...novel, recommendationRate };
  }

  async updateNovelCategories(novelId: string, categoryIds: number[]) {
    await this.novelRepo.updateNovelCategories(novelId, categoryIds);
  }

  async updateNovelTags(novelId: string, tagIds: string[]) {
    await this.novelRepo.updateNovelTags(novelId, tagIds);
  }

  async checkNovelExists(id: string): Promise<boolean> {
    return await this.novelRepo.existControl({ id });
  }

  incrementViewCount(novelId: string) {
    return this.novelRepo.incrementViewCount(novelId);
  }

  async updateNovel(dto: UpdateNovelDTO) {
    const novelExists = await this.novelRepo.existControl({ id: dto.id });
    if (!novelExists)
      throw new NotFoundError("Güncellenmek istenen novel bulunamadı.");
    await this.novelRepo.updateNovel(dto);
  }

  async deleteNovel(novelId: string): Promise<void> {
    await this.novelRepo.deleteNovel(novelId);
  }
}
