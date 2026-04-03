import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.js";
import { Chapter } from "./Chapter.js";

@Entity()
@Index(["userId", "chapterId"], { unique: true })
export class ChapterPurchase {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "uuid" })
  chapterId!: string;

  @CreateDateColumn()
  purchasedAt!: Date;

  @ManyToOne(() => User, (user) => user.purchases)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Chapter, (chapter) => chapter.purchases)
  @JoinColumn({ name: "chapterId" })
  chapter!: Chapter;
}
