import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad.request.js";
import { IFeedbackService } from "../interfaces/feedback.service.interface.js";

export class FeedbackController {
  constructor(private feedbackService: IFeedbackService) {}

  createFeedbackSubmission = async (req: Request, res: Response) => {
    const user = req.user;
    const email = user?.email ?? req.body.email ?? null;

    if (!email) {
      throw new BadRequestError("Misafir kullanicilar icin email zorunludur.");
    }

    const feedback = await this.feedbackService.createFeedbackSubmission({
      type: req.body.type,
      subject: req.body.subject,
      message: req.body.message,
      email,
      userId: user?.id ?? null,
      metadata: {
        ...(req.body.metadata ?? {}),
        userAgent: req.body.metadata?.userAgent ?? req.headers["user-agent"],
        ip: req.ip,
      },
    });

    res.status(201).json({
      message: "Mesajin alindi. Gerektiginde email uzerinden donus yapabiliriz.",
      item: feedback,
    });
  };

  getFeedbackSubmissions = async (req: Request, res: Response) => {
    const feedback = await this.feedbackService.getFeedbackSubmissions(
      res.locals.validatedData,
    );
    res.status(200).json(feedback);
  };

  getFeedbackSubmissionById = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const feedback = await this.feedbackService.getFeedbackSubmissionById(id);
    res.status(200).json(feedback);
  };

  updateFeedbackStatus = async (req: Request, res: Response) => {
    const { id, status } = res.locals.validatedData;
    const feedback = await this.feedbackService.updateFeedbackStatus(id, {
      status,
    });
    res.status(200).json({
      message: "Geri bildirim durumu guncellendi.",
      item: feedback,
    });
  };
}
