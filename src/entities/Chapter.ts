import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { ChapterPublication } from "./ChapterPublication.js";
import { ReadingStats } from "./ReadingStats.js";
import { ChapterComment } from "./ChapterComment.js";

@Entity()
@Unique(["id", "novelId"])
export class Chapter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.chapters, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "int", default: 0 })
  commentCount!: number;

  @OneToOne(() => ChapterPublication, (publication) => publication.chapter, {
    cascade: true,
    nullable: true,
  })
  publication?: ChapterPublication;

  @OneToMany(() => ReadingStats, (stats) => stats.chapter)
  readingStats!: ReadingStats[];

  @OneToMany(() => ChapterComment, (comment) => comment.chapter)
  comments!: ChapterComment[];
}
