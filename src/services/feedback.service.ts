import { NotFoundError } from "../errors/not.found.error.js";
import { IFeedbackService } from "../interfaces/feedback.service.interface.js";
import { CreateFeedbackSubmissionDto } from "../interfaces/feedback.submission.repo.interface.js";
import { GetFeedbackSubmissionsDto } from "../schemas/get.feedback.submissions.schema.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { UpdateFeedbackStatusDto } from "../schemas/update.feedback.status.schema.js";

export class FeedbackService implements IFeedbackService {
  constructor(private uow: IUnitOfWork) {}

  async createFeedbackSubmission(dto: CreateFeedbackSubmissionDto) {
    return await this.uow.feedbackSubmissionRepository.create(dto);
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
