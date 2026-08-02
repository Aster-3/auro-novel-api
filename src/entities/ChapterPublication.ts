import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Chapter } from "./Chapter.js";
import { Volume } from "./Volume.js";

@Entity()
@Index(["volumeId", "sortKey"], { unique: true })
export class ChapterPublication {
  @PrimaryColumn("uuid")
  chapterId!: string;

  @OneToOne(() => Chapter, (chapter) => chapter.publication, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "chapterId" })
  chapter!: Chapter;

  @Column({ type: "uuid" })
  volumeId!: string;

  @ManyToOne(() => Volume, (volume) => volume.chapters, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "volumeId" })
  volume!: Volume;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 4,
    default: 1000.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  sortKey!: number;

  @Index()
  @Column({ type: "timestamp" })
  publishedAt!: Date;
}
