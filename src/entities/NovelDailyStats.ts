import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Novel } from "./Novel.js";

@Entity()
export class NovelDailyStats {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  totalViews!: number;

  @Column({ type: "int" })
  totalReviews!: number;

  @Column({ type: "int" })
  totalPositiveReviews!: number;

  @Column({ type: "int", default: 0 })
  totalLibraryCount!: number;

  @Column({ type: "uuid" })
  novelId!: string;

  @Column({ type: "date" })
  recordedAt!: string;

  @ManyToOne(() => Novel, (novel) => novel.dailyStats, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;
}
