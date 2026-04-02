import { IReplyService } from "../interfaces/reply.service.interface.js";

export class ReplyController {
  constructor(private replyService: IReplyService) {}

  createReply = async (req: any, res: any) => {
    const userId = req.user?.id;

    const reply = await this.replyService.createReply({ ...req.body, userId });
    res.json(reply);
  };

  deleteReply = async (req: any, res: any) => {
    const { replyId } = req.params;
    const userId = req.user?.id;
    await this.replyService.deleteReply({ replyId: Number(replyId), userId });
    res.sendStatus(204);
  };

  toggleLike = async (req: any, res: any) => {
    const { replyId } = req.params;
    const userId = req.user?.id;
    const isLiked = await this.replyService.toggleLike(userId, Number(replyId));
    res.json({ isLiked });
  };
}
