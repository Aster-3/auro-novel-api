import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Chapter } from "./Chapter.js";
import { Novel } from "./Novel.js";
import { User } from "./User.js";

@Entity()
@Unique(["userId", "novelId", "chapterId"])
export class UserReadChapter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "uuid" })
  chapterId!: string;

  @ManyToOne(() => Chapter, { onDelete: "CASCADE" })
  @JoinColumn([
    { name: "chapterId", referencedColumnName: "id" },
    { name: "novelId", referencedColumnName: "novelId" },
  ])
  chapter!: Chapter;
}
