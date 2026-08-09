import { Request, Response } from "express";
import { IEditorPickService } from "../interfaces/editor.pick.service.interface.js";
import { canShowAdultContent } from "../utils/adult.content.visibility.js";

export class EditorPickController {
  constructor(private editorPickService: IEditorPickService) {}

  getHomeEditorPicks = async (req: Request, res: Response) => {
    const { limit } = req.query as any;
    const editorPicks = await this.editorPickService.getHomeEditorPicks(
      limit ? parseInt(limit) : undefined,
      canShowAdultContent(req.user),
      req.user?.id,
    );
    res.status(200).json(editorPicks);
  };

  getAdminEditorPicks = async (req: Request, res: Response) => {
    const editorPicks = await this.editorPickService.getAdminEditorPicks();
    res.status(200).json(editorPicks);
  };

  createEditorPick = async (req: Request, res: Response) => {
    const editorPick = await this.editorPickService.createEditorPick(
      res.locals.validatedData,
    );
    res.status(201).json(editorPick);
  };

  updateEditorPickStatus = async (req: Request, res: Response) => {
    const { id, isActive } = res.locals.validatedData;
    await this.editorPickService.updateEditorPickStatus(id, isActive);
    res.sendStatus(204);
  };

  reorderEditorPicks = async (req: Request, res: Response) => {
    await this.editorPickService.reorderEditorPicks(res.locals.validatedData);
    res.sendStatus(204);
  };

  deleteEditorPick = async (req: Request, res: Response) => {
    const { id } = res.locals.validatedData;
    await this.editorPickService.deleteEditorPick(id);
    res.sendStatus(204);
  };
}
