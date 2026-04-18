import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "./User.js";
import { Novel } from "./Novel.js";
import { Chapter } from "./Chapter.js";

@Entity()
@Unique(["userId", "novelId"])
export class ReadingStats {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.readingStats, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.readingStats, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "uuid" })
  lastReadChapterId!: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.readingStats, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "lastReadChapterId" })
  chapter!: Chapter;

  @Column({ type: "float", default: 0 })
  lastChapterProgress!: number;

  @Column({ type: "int", default: 0 })
  totalReadTime!: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastReadAt!: Date;
}
