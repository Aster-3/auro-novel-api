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
import { ChapterPurchase } from "./ChapterPurchase.js";
import { ReadingStats } from "./ReadingStats.js";

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

  @OneToOne(() => ChapterPublication, (publication) => publication.chapter, {
    cascade: true,
    nullable: true,
  })
  publication?: ChapterPublication;

  @OneToMany(() => ChapterPurchase, (purchase) => purchase.chapter, {
    cascade: true,
    nullable: true,
  })
  purchases?: ChapterPurchase[];

  @OneToMany(() => ReadingStats, (stats) => stats.chapter)
  readingStats!: ReadingStats[];
}
