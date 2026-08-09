import { DeleteResult, Repository, UpdateResult } from "typeorm";
import { EditorPick } from "../entities/EditorPick.js";
import { IEditorPickRepository } from "../interfaces/editor.pick.repo.interface.js";
import { CreateEditorPickDto } from "../schemas/create.editor.pick.schema.js";
import { SeriesStatus } from "../constants/series.constants.js";
import { applyAdultContentFilter } from "../utils/adult.content.visibility.js";
import { applyBlockedUserVisibilityFilter } from "../utils/user.block.visibility.js";

export class EditorPickRepository implements IEditorPickRepository {
  constructor(private editorPickRepo: Repository<EditorPick>) {}

  async create(dto: CreateEditorPickDto) {
    return this.editorPickRepo.save(dto);
  }

  async findActiveForHome(
    limit: number,
    allowAdultContent = false,
    viewerId?: string,
  ) {
    const query = this.editorPickRepo
      .createQueryBuilder("editorPick")
      .innerJoinAndSelect("editorPick.novel", "novel")
      .leftJoinAndSelect("novel.author", "author")
      .leftJoinAndSelect("author.user", "authorUser")
      .where("editorPick.isActive = true")
      .andWhere("novel.status != :draft", { draft: SeriesStatus.DRAFT })
      .andWhere('(novel."bannedUntil" IS NULL OR novel."bannedUntil" <= NOW())')
      .orderBy("editorPick.orderIndex", "ASC")
      .addOrderBy("editorPick.createdAt", "DESC")
      .take(limit);

    applyAdultContentFilter(query as any, allowAdultContent);
    applyBlockedUserVisibilityFilter(query as any, viewerId, "authorUser");

    return query.getMany();
  }

  async findAll() {
    return this.editorPickRepo.find({
      relations: { novel: true },
      order: { orderIndex: "ASC", createdAt: "DESC" },
    });
  }

  async findById(id: string) {
    return this.editorPickRepo.findOne({ where: { id } });
  }

  async existsByNovelId(novelId: string) {
    return this.editorPickRepo.exists({ where: { novelId } });
  }

  async updateStatus(id: string, isActive: boolean): Promise<UpdateResult> {
    return this.editorPickRepo.update({ id }, { isActive });
  }

  async updateOrder(items: { id: string; orderIndex: number }[]) {
    await this.editorPickRepo.manager.transaction(async (manager) => {
      await Promise.all(
        items.map((item) =>
          manager.update(
            EditorPick,
            { id: item.id },
            { orderIndex: item.orderIndex },
          ),
        ),
      );
    });
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.editorPickRepo.delete({ id });
  }
}
