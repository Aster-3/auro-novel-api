import { IReplyService } from "../interfaces/reply.service.interface.js";

export class ReplyController {
  constructor(private replyService: IReplyService) {}

  createReply = async (req: any, res: any) => {
    const reply = await this.replyService.createReply(req.body);
    res.json(reply);
  };

  deleteReply = async (req: any, res: any) => {
    const { id } = req.params;
    await this.replyService.deleteReply(Number(id));
    res.sendStatus(204);
  };
}
