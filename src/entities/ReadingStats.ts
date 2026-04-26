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

  @Column({ type: "uuid" })
  lastReadChapterId!: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.readingStats, {
    onDelete: "CASCADE",
  })
  @JoinColumn([
    { name: "lastReadChapterId", referencedColumnName: "id" },
    { name: "novelId", referencedColumnName: "novelId" },
  ])
  chapter!: Chapter;

  @Column({ type: "float", default: 0 })
  lastChapterProgress!: number;

  @Column({ type: "int", default: 0 })
  totalReadTime!: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastReadAt!: Date;
}
