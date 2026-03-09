import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
} from "typeorm";
import { Comment } from "../entities/Comment.js";

@EventSubscriber()
export class CommentSubscriber implements EntitySubscriberInterface<Comment> {
  listenTo() {
    return Comment;
  }

  async afterInsert(event: InsertEvent<Comment>) {
    const { entity, manager } = event;

    if (entity.rootCommentId) {
      await manager.increment(
        Comment,
        { id: entity.rootCommentId },
        "replyCount",
        1,
      );
    }
  }

  async afterRemove(event: RemoveEvent<Comment>) {
    const { entity, manager } = event;

    if (entity && entity.rootCommentId) {
      await manager.decrement(
        Comment,
        { id: entity.rootCommentId },
        "replyCount",
        1,
      );
    }
  }
}
