import { DeleteResult, UpdateResult } from "typeorm";
import { EditorPick } from "../entities/EditorPick.js";
import { CreateEditorPickDto } from "../schemas/create.editor.pick.schema.js";

export interface IEditorPickRepository {
  create(dto: CreateEditorPickDto): Promise<EditorPick>;
  findActiveForHome(
    limit: number,
    allowAdultContent?: boolean,
    viewerId?: string,
  ): Promise<EditorPick[]>;
  findAll(): Promise<EditorPick[]>;
  findById(id: string): Promise<EditorPick | null>;
  existsByNovelId(novelId: string): Promise<boolean>;
  updateStatus(id: string, isActive: boolean): Promise<UpdateResult>;
  updateOrder(items: { id: string; orderIndex: number }[]): Promise<void>;
  delete(id: string): Promise<DeleteResult>;
}
