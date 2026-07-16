import { FindAndCountType } from "../constants/findAndCountType.js";
import {
  FeedbackSubmissionStatus,
  FeedbackSubmissionType,
} from "../constants/feedback.constants.js";
import { FeedbackSubmission } from "../entities/FeedbackSubmission.js";
import { GetFeedbackSubmissionsDto } from "../schemas/get.feedback.submissions.schema.js";

export interface CreateFeedbackSubmissionDto {
  userId?: string | null;
  email?: string | null;
  type: FeedbackSubmissionType;
  subject: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

export interface IFeedbackSubmissionRepository {
  create(dto: CreateFeedbackSubmissionDto): Promise<FeedbackSubmission>;
  getAll(
    dto: GetFeedbackSubmissionsDto,
  ): Promise<FindAndCountType<FeedbackSubmission>>;
  getOneById(id: string): Promise<FeedbackSubmission | null>;
  updateStatus(
    id: string,
    status: FeedbackSubmissionStatus,
  ): Promise<FeedbackSubmission | null>;
}
