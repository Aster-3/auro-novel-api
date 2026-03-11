import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./User.js";
import { Reply } from "./Reply.js";

@Entity()
export class ReplyLike {
  @PrimaryColumn({ type: "uuid" })
  userId!: string;

  @PrimaryColumn({ type: "int" })
  replyId!: number;

  @ManyToOne(() => Reply, (reply) => reply.likes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "replyId" })
  reply!: Reply;

  @ManyToOne(() => User, (user) => user.replyLikes, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;
}
