import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User.js";
import { Novel } from "./Novel.js";
import { CommentLike } from "./CommentLike.js";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "uuid", nullable: false })
  userId!: string;

  @ManyToOne(() => User, (user) => user.comments, { nullable: false })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "uuid", nullable: false })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.id, { nullable: false })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "varchar", nullable: false, length: 1500 })
  content!: string;

  @Column({ type: "boolean", nullable: true })
  isRecommend?: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  likes!: CommentLike[];

  @Column({ type: "int", default: 0 })
  likeCount!: number;

  @Column({ type: "int", default: 0 })
  replyCount!: number;

  @Column({ type: "int", nullable: true })
  parentCommentId?: number;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentCommentId" })
  parentComment?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies?: Comment[];

  @Column({ type: "int", nullable: true })
  rootCommentId?: number;

  @ManyToOne(() => Comment, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "rootCommentId" })
  rootComment?: Comment;
}
