import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Chapter } from "./Chapter.js";
import { Novel } from "./Novel.js";
import { User } from "./User.js";
import { ChapterCommentLike } from "./ChapterCommentLike.js";

@Entity()
export class ChapterComment {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 1500 })
  content!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.chapterComments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Index()
  @Column({ type: "uuid" })
  chapterId!: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.comments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "chapterId" })
  chapter!: Chapter;

  @Index()
  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.id, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Index()
  @Column({ type: "int", nullable: true })
  rootCommentId!: number | null;

  @ManyToOne(() => ChapterComment, (comment) => comment.replies, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "rootCommentId" })
  rootComment?: ChapterComment | null;

  @Index()
  @Column({ type: "int", nullable: true })
  parentCommentId!: number | null;

  @ManyToOne(() => ChapterComment, (comment) => comment.children, {
    nullable: true,
    onDelete: "NO ACTION",
  })
  @JoinColumn({ name: "parentCommentId" })
  parentComment?: ChapterComment | null;

  @Column({ type: "int", default: 0 })
  likeCount!: number;

  @Column({ type: "int", default: 0 })
  replyCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @OneToMany(() => ChapterComment, (comment) => comment.rootComment)
  replies!: ChapterComment[];

  @OneToMany(() => ChapterComment, (comment) => comment.parentComment)
  children!: ChapterComment[];

  @OneToMany(() => ChapterCommentLike, (like) => like.comment)
  likes!: ChapterCommentLike[];
}
