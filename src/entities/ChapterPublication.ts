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
import { PublicationStatus } from "../constants/chapter.constants.js";

@Entity()
@Index(["volumeId", "orderIndex"], { unique: true })
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
    precision: 6,
    scale: 2,
    default: 1.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  orderIndex!: number;

  @Index()
  @Column({
    type: "enum",
    enum: PublicationStatus,
    default: PublicationStatus.PUBLISHED,
  })
  publicationStatus!: PublicationStatus;

  @Index()
  @Column({ type: "timestamp" })
  publishedAt!: Date;
}
