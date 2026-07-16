import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ChapterComment } from "./ChapterComment.js";
import { User } from "./User.js";

@Entity()
export class ChapterCommentLike {
  @PrimaryColumn({ type: "uuid" })
  userId!: string;

  @PrimaryColumn({ type: "int" })
  commentId!: number;

  @ManyToOne(() => ChapterComment, (comment) => comment.likes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "commentId" })
  comment!: ChapterComment;

  @ManyToOne(() => User, (user) => user.chapterCommentLikes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;
}
