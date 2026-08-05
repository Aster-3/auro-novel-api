import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Novel } from "./Novel.js";

@Entity()
@Unique("UQ_novel_weekly_rank_snapshot_novel_recorded", [
  "novelId",
  "recordedAt",
])
export class NovelWeeklyRankSnapshot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "decimal", precision: 10, scale: 4, default: 0 })
  rankingScore!: number;

  @Column({ type: "int" })
  rank!: number;

  @Index()
  @Column({ type: "date" })
  recordedAt!: string;
}
