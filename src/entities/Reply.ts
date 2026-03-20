import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User.js";
import { Comment } from "./Comment.js";
import { ReplyLike } from "./ReplyLike.js";

@Entity()
export class Reply {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 1500 })
  content!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.replies, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "int", default: 0 })
  likeCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Index()
  @Column({ type: "int", nullable: true })
  parentReplyId!: number | null;

  @ManyToOne(() => Reply, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "parentReplyId" })
  parentReply?: Reply | null;

  @Index()
  @Column({ type: "int" })
  rootCommentId!: number;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "rootCommentId" })
  comment!: Comment;

  @OneToMany(() => Reply, (reply) => reply.parentReply)
  children!: Reply[];

  @OneToMany(() => ReplyLike, (replyLike) => replyLike.reply)
  likes!: ReplyLike[];
}
