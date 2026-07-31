import { Request, Response } from "express";
import { IAdminService } from "../interfaces/admin.service.interface.js";

export class AdminController {
  constructor(private adminService: IAdminService) {}

  private getParam(req: Request, key: string) {
    return String(req.params[key]);
  }

  getDashboard = async (req: Request, res: Response) => {
    const result = await this.adminService.getDashboard();
    res.json(result);
  };

  getDeletedAccountRecoveries = async (req: Request, res: Response) => {
    const result = await this.adminService.getDeletedAccountRecoveries(
      res.locals.validatedData,
    );
    res.json(result);
  };

  searchDeletedAccountRecovery = async (req: Request, res: Response) => {
    const result = await this.adminService.searchDeletedAccountRecovery(
      res.locals.validatedData,
    );
    res.json(result);
  };

  restoreDeletedUser = async (req: Request, res: Response) => {
    const item = await this.adminService.restoreDeletedUser(req.body);
    res.json({ message: "Kullanici geri getirildi.", item });
  };

  createIndependentAuthor = async (req: Request, res: Response) => {
    const item = await this.adminService.createIndependentAuthor(req.body);
    res.status(201).json({ message: "Yazar olusturuldu.", item });
  };

  getUsers = async (req: Request, res: Response) => {
    const result = await this.adminService.getUsers(res.locals.validatedData);
    res.json(result);
  };

  getUserById = async (req: Request, res: Response) => {
    const item = await this.adminService.getUserById(this.getParam(req, "id"));
    res.json({ item });
  };

  updateUser = async (req: Request, res: Response) => {
    const item = await this.adminService.updateUser(
      this.getParam(req, "id"),
      req.body,
    );
    res.json({ message: "Kullanici guncellendi.", item });
  };

  deleteUser = async (req: Request, res: Response) => {
    await this.adminService.deleteUser(this.getParam(req, "id"));
    res.status(204).send();
  };

  createNovel = async (req: Request, res: Response) => {
    const item = await this.adminService.createNovel(
      req.body,
      req.file ?? undefined,
    );
    res.status(201).json({ message: "Roman olusturuldu.", item });
  };

  getNovels = async (req: Request, res: Response) => {
    const result = await this.adminService.getNovels(res.locals.validatedData);
    res.json(result);
  };

  getNovelById = async (req: Request, res: Response) => {
    const item = await this.adminService.getNovelById(this.getParam(req, "id"));
    res.json({ item });
  };

  updateNovel = async (req: Request, res: Response) => {
    const item = await this.adminService.updateNovel(
      this.getParam(req, "id"),
      req.body,
      req.file ?? undefined,
    );
    res.json({ message: "Roman guncellendi.", item });
  };

  deleteNovel = async (req: Request, res: Response) => {
    await this.adminService.deleteNovel(this.getParam(req, "id"));
    res.status(204).send();
  };

  updateNovelCategories = async (req: Request, res: Response) => {
    const item = await this.adminService.updateNovelCategories(
      this.getParam(req, "id"),
      req.body.categories,
    );
    res.json({ message: "Roman kategorileri guncellendi.", item });
  };

  updateNovelTags = async (req: Request, res: Response) => {
    const item = await this.adminService.updateNovelTags(
      this.getParam(req, "id"),
      req.body.tags,
    );
    res.json({ message: "Roman etiketleri guncellendi.", item });
  };

  getVolumesByNovelId = async (req: Request, res: Response) => {
    const items = await this.adminService.getVolumesByNovelId(
      this.getParam(req, "id"),
    );
    res.json({ items });
  };

  createVolume = async (req: Request, res: Response) => {
    const item = await this.adminService.createVolume(
      this.getParam(req, "id"),
      req.body,
    );
    res.status(201).json({ message: "Cilt olusturuldu.", item });
  };

  updateVolume = async (req: Request, res: Response) => {
    const item = await this.adminService.updateVolume(
      this.getParam(req, "id"),
      req.body.name,
    );
    res.json({ message: "Cilt guncellendi.", item });
  };

  deleteVolume = async (req: Request, res: Response) => {
    await this.adminService.deleteVolume(this.getParam(req, "id"));
    res.status(204).send();
  };

  createChapter = async (req: Request, res: Response) => {
    const item = await this.adminService.createChapter(
      this.getParam(req, "id"),
      req.body,
    );
    res.status(201).json({ message: "Bolum taslagi olusturuldu.", item });
  };

  getChapters = async (req: Request, res: Response) => {
    const result = await this.adminService.getChapters(
      res.locals.validatedData,
    );
    res.json(result);
  };

  getChapterById = async (req: Request, res: Response) => {
    const item = await this.adminService.getChapterById(
      this.getParam(req, "id"),
    );
    res.json({ item });
  };

  updateChapter = async (req: Request, res: Response) => {
    const item = await this.adminService.updateChapter(
      this.getParam(req, "id"),
      req.body,
    );
    res.json({ message: "Bolum guncellendi.", item });
  };

  updateChapterPublicationStatus = async (req: Request, res: Response) => {
    await this.adminService.updateChapterPublicationStatus(
      this.getParam(req, "id"),
      req.body.publicationStatus,
    );
    res.json({ message: "Bolum yayin durumu guncellendi." });
  };

  publishChapter = async (req: Request, res: Response) => {
    const item = await this.adminService.publishChapter(
      this.getParam(req, "id"),
      req.body,
    );
    res.status(201).json({ message: "Bolum yayinlandi.", item });
  };

  deleteChapter = async (req: Request, res: Response) => {
    await this.adminService.deleteChapter(this.getParam(req, "id"));
    res.status(204).send();
  };

  getComments = async (req: Request, res: Response) => {
    const result = await this.adminService.getComments(
      res.locals.validatedData,
    );
    res.json(result);
  };

  deleteComment = async (req: Request, res: Response) => {
    await this.adminService.deleteComment(Number(req.params.id));
    res.status(204).send();
  };

  getReplies = async (req: Request, res: Response) => {
    const result = await this.adminService.getReplies(res.locals.validatedData);
    res.json(result);
  };

  deleteReply = async (req: Request, res: Response) => {
    await this.adminService.deleteReply(Number(req.params.id));
    res.status(204).send();
  };

  getAnnouncements = async (req: Request, res: Response) => {
    const result = await this.adminService.getAnnouncements(
      res.locals.validatedData,
    );
    res.json(result);
  };

  getAnnouncementById = async (req: Request, res: Response) => {
    const item = await this.adminService.getAnnouncementById(
      this.getParam(req, "id"),
    );
    res.json({ item });
  };

  createAnnouncement = async (req: Request, res: Response) => {
    const result = await this.adminService.createAnnouncement(req.body);
    res.status(201).json({
      message: "Duyuru basariyla olusturuldu.",
      ...result,
    });
  };

  updateAnnouncement = async (req: Request, res: Response) => {
    const item = await this.adminService.updateAnnouncement(
      this.getParam(req, "id"),
      req.body,
    );
    res.json({ message: "Duyuru guncellendi.", item });
  };

  deleteAnnouncement = async (req: Request, res: Response) => {
    await this.adminService.deleteAnnouncement(this.getParam(req, "id"));
    res.status(204).send();
  };
}
