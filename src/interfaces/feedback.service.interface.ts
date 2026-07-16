import { FeedbackSubmission } from "../entities/FeedbackSubmission.js";
import { CreateFeedbackSubmissionDto } from "./feedback.submission.repo.interface.js";
import { GetFeedbackSubmissionsDto } from "../schemas/get.feedback.submissions.schema.js";
import { FindAndCountType } from "../constants/findAndCountType.js";
import { UpdateFeedbackStatusDto } from "../schemas/update.feedback.status.schema.js";

export interface IFeedbackService {
  createFeedbackSubmission(
    dto: CreateFeedbackSubmissionDto,
  ): Promise<FeedbackSubmission>;
  getFeedbackSubmissions(
    dto: GetFeedbackSubmissionsDto,
  ): Promise<FindAndCountType<FeedbackSubmission>>;
  getFeedbackSubmissionById(id: string): Promise<FeedbackSubmission>;
  updateFeedbackStatus(
    id: string,
    dto: UpdateFeedbackStatusDto,
  ): Promise<FeedbackSubmission>;
}
