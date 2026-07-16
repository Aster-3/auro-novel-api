import { Repository } from "typeorm";
import {
  CreateFeedbackSubmissionDto,
  IFeedbackSubmissionRepository,
} from "../interfaces/feedback.submission.repo.interface.js";
import { FeedbackSubmission } from "../entities/FeedbackSubmission.js";
import { GetFeedbackSubmissionsDto } from "../schemas/get.feedback.submissions.schema.js";
import { FeedbackSubmissionStatus } from "../constants/feedback.constants.js";

export class FeedbackSubmissionRepository
  implements IFeedbackSubmissionRepository
{
  constructor(private feedbackRepo: Repository<FeedbackSubmission>) {}

  async create(dto: CreateFeedbackSubmissionDto) {
    const feedback = this.feedbackRepo.create({
      ...dto,
      email: dto.email ?? null,
      userId: dto.userId ?? null,
      metadata: dto.metadata ?? null,
    });

    return await this.feedbackRepo.save(feedback);
  }

  async getAll(dto: GetFeedbackSubmissionsDto) {
    const { page, limit, type, status } = dto;
    const skip = (page - 1) * limit;

    const query = this.feedbackRepo
      .createQueryBuilder("feedback")
      .leftJoinAndSelect("feedback.user", "user")
      .select([
        "feedback.id",
        "feedback.userId",
        "feedback.email",
        "feedback.type",
        "feedback.status",
        "feedback.subject",
        "feedback.message",
        "feedback.metadata",
        "feedback.createdAt",
        "user.id",
        "user.username",
        "user.nickname",
        "user.email",
      ])
      .addSelect(
        `CASE feedback.status
          WHEN :pending THEN 0
          WHEN :inProgress THEN 1
          WHEN :resolved THEN 2
          ELSE 3
        END`,
        "feedback_status_rank",
      )
      .orderBy("feedback_status_rank", "ASC")
      .addOrderBy("feedback.createdAt", "DESC")
      .setParameters({
        pending: FeedbackSubmissionStatus.PENDING,
        inProgress: FeedbackSubmissionStatus.IN_PROGRESS,
        resolved: FeedbackSubmissionStatus.RESOLVED,
      })
      .skip(skip)
      .take(limit);

    if (type) {
      query.andWhere("feedback.type = :type", { type });
    }
    if (status) {
      query.andWhere("feedback.status = :status", { status });
    }

    const [items, total] = await query.getManyAndCount();
    const lastPage = Math.ceil(total / limit);
    const nextPage = page < lastPage ? page + 1 : null;

    return {
      items,
      total,
      currentPage: page,
      nextPage,
      lastPage,
    };
  }

  async getOneById(id: string) {
    return await this.feedbackRepo.findOne({
      where: { id },
      relations: {
        user: true,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        type: true,
        status: true,
        subject: true,
        message: true,
        metadata: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
          nickname: true,
          email: true,
        },
      },
    });
  }

  async updateStatus(id: string, status: FeedbackSubmissionStatus) {
    await this.feedbackRepo.update({ id }, { status });
    return this.getOneById(id);
  }
}
