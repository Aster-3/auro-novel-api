import { NotFoundError } from "../errors/not.found.error.js";
import { IFeedbackService } from "../interfaces/feedback.service.interface.js";
import { CreateFeedbackSubmissionDto } from "../interfaces/feedback.submission.repo.interface.js";
import { GetFeedbackSubmissionsDto } from "../schemas/get.feedback.submissions.schema.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { MailService } from "./mail.service.js";
import { UpdateFeedbackStatusDto } from "../schemas/update.feedback.status.schema.js";

export class FeedbackService implements IFeedbackService {
  constructor(
    private uow: IUnitOfWork,
    private mailService: MailService,
  ) {}

  async createFeedbackSubmission(dto: CreateFeedbackSubmissionDto) {
    const feedback =
      await this.uow.feedbackSubmissionRepository.create(dto);

    await this.mailService.sendFeedbackNotification(feedback);

    return feedback;
  }

  async getFeedbackSubmissions(dto: GetFeedbackSubmissionsDto) {
    return await this.uow.feedbackSubmissionRepository.getAll(dto);
  }

  async getFeedbackSubmissionById(id: string) {
    const feedback =
      await this.uow.feedbackSubmissionRepository.getOneById(id);

    if (!feedback) {
      throw new NotFoundError("Geri bildirim bulunamadi.");
    }

    return feedback;
  }

  async updateFeedbackStatus(id: string, dto: UpdateFeedbackStatusDto) {
    const feedback = await this.uow.feedbackSubmissionRepository.updateStatus(
      id,
      dto.status,
    );

    if (!feedback) {
      throw new NotFoundError("Geri bildirim bulunamadi.");
    }

    return feedback;
  }
}
