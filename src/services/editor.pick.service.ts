import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IEditorPickRepository } from "../interfaces/editor.pick.repo.interface.js";
import {
  EditorPickItem,
  IEditorPickService,
} from "../interfaces/editor.pick.service.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { CreateEditorPickDto } from "../schemas/create.editor.pick.schema.js";
import { ReorderEditorPicksDto } from "../schemas/reorder.editor.picks.schema.js";
import { presentAuthor } from "../utils/deleted.user.presenter.js";

export class EditorPickService implements IEditorPickService {
  constructor(
    private editorPickRepository: IEditorPickRepository,
    private novelRepository: INovelRepository,
  ) {}

  async getHomeEditorPicks(
    limit: number = 15,
    allowAdultContent = false,
    viewerId?: string,
  ): Promise<EditorPickItem[]> {
    const safeLimit = Math.min(Math.max(Number(limit) || 15, 1), 50);
    const editorPicks = await this.editorPickRepository.findActiveForHome(
      safeLimit,
      allowAdultContent,
      viewerId,
    );

    return editorPicks.map((editorPick) => {
      const novel = editorPick.novel;
      const author = presentAuthor(novel.author);

      return {
        id: novel.id,
        name: novel.name,
        coverImage: novel.coverImage ?? null,
        synopsis: novel.synopsis ?? null,
        chapterCount: novel.chapterCount,
        averageChapterWordCount: novel.averageChapterWordCount,
        viewCount: novel.viewCount,
        totalReviewsCount: novel.totalReviewsCount,
        recommendationRate:
          novel.totalReviewsCount > 0
            ? Math.round(
                (novel.positiveReviewsCount / novel.totalReviewsCount) * 100,
              )
            : null,
        authorName: author.authorName,
        authorIsDeleted: author.isDeletedUser,
        editorPickId: editorPick.id,
        editorPickOrder: editorPick.orderIndex,
      };
    });
  }

  async getAdminEditorPicks() {
    return this.editorPickRepository.findAll();
  }

  async createEditorPick(dto: CreateEditorPickDto) {
    const novelExists = await this.novelRepository.existControl({
      id: dto.novelId,
    });
    if (!novelExists) {
      throw new NotFoundError("Roman bulunamadi.");
    }

    const alreadyPicked = await this.editorPickRepository.existsByNovelId(
      dto.novelId,
    );
    if (alreadyPicked) {
      throw new ConflictError("novelId", "Bu roman zaten editor secimlerinde.");
    }

    return this.editorPickRepository.create(dto);
  }

  async updateEditorPickStatus(id: string, isActive: boolean) {
    const result = await this.editorPickRepository.updateStatus(id, isActive);
    if (result.affected === 0) {
      throw new NotFoundError("Editor secimi bulunamadi.");
    }
  }

  async reorderEditorPicks(dto: ReorderEditorPicksDto) {
    await this.editorPickRepository.updateOrder(dto.items);
  }

  async deleteEditorPick(id: string) {
    const result = await this.editorPickRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundError("Editor secimi bulunamadi.");
    }
  }
}
