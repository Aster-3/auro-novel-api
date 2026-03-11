import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Comment } from "./Comment.js";
import { User } from "./User.js";

@Entity()
export class CommentLike {
  @PrimaryColumn({ type: "uuid" })
  userId!: string;

  @PrimaryColumn({ type: "int" })
  commentId!: number;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "commentId" })
  comment!: Comment;

  @ManyToOne(() => User, (user) => user.commentLikes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;
}
