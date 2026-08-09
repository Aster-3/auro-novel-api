import { EditorPick } from "../entities/EditorPick.js";
import { CreateEditorPickDto } from "../schemas/create.editor.pick.schema.js";
import { ReorderEditorPicksDto } from "../schemas/reorder.editor.picks.schema.js";

export type EditorPickItem = {
  id: string;
  name: string;
  coverImage: string | null;
  synopsis: string | null;
  chapterCount: number;
  averageChapterWordCount: number | null;
  viewCount: number;
  totalReviewsCount: number;
  recommendationRate: number | null;
  authorName: string;
  authorIsDeleted: boolean;
  editorPickId: string;
  editorPickOrder: number;
};

export interface IEditorPickService {
  getHomeEditorPicks(
    limit?: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<EditorPickItem[]>;
  getAdminEditorPicks(): Promise<EditorPick[]>;
  createEditorPick(dto: CreateEditorPickDto): Promise<EditorPick>;
  updateEditorPickStatus(id: string, isActive: boolean): Promise<void>;
  reorderEditorPicks(dto: ReorderEditorPicksDto): Promise<void>;
  deleteEditorPick(id: string): Promise<void>;
}
