import { Repository } from "typeorm";
import { IReplyRepository } from "../interfaces/reply.repo.interface.js";
import { CreateReplyDto } from "../schemas/create.reply.schema.js";
import { Reply } from "../entities/Reply.js";
import { GetCommentRepliesDto } from "../schemas/get.comment.replies.schema.js";

export class ReplyRepository implements IReplyRepository {
  constructor(private replyRepo: Repository<Reply>) {}

  create = async (replyDto: CreateReplyDto) => {
    return await this.replyRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const newReply = await transactionalEntityManager.save(
          this.replyRepo.target,
          replyDto,
        );
        if (replyDto.rootCommentId) {
          await transactionalEntityManager.increment(
            "Comment",
            { id: replyDto.rootCommentId },
            "replyCount",
            1,
          );
        }

        return newReply;
      },
    );
  };

  delete = async (id: number) => {
    await this.replyRepo.delete(id);
  };

  getCommentReplies = async (dto: GetCommentRepliesDto) => {
    const { id, page, limit } = dto;

    const [replies, total] = await this.replyRepo.findAndCount({
      where: {
        rootCommentId: id,
      },
      select: {
        id: true,
        content: true,
        likeCount: true,
        createdAt: true,
        user: {
          id: true,
          nickname: true,
          profileImageUrl: true,
        },
        parentReply: {
          content: true,
          user: { nickname: true },
        },
      },
      relations: {
        user: true,
        parentReply: {
          user: true,
        },
      },
      order: { createdAt: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: replies,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  };
}
