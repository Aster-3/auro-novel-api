import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { NovelType, SeriesStatus } from "../constants/series.constants.js";
import { Comment } from "./Comment.js";
import { Chapter } from "./Chapter.js";
import { Category } from "./Category.js";
import { Tags } from "./Tags.js";
import { Library } from "./Library.js";
import { Volume } from "./Volume.js";
import { Author } from "./Author.js";
import { NovelDailyStats } from "./NovelDailyStats.js";

@Entity()
export class Novel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 200, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  coverImage?: string | null;

  @Column({ type: "varchar", length: "1500", nullable: true })
  synopsis?: string | null;

  @Index()
  @Column({ type: "enum", enum: SeriesStatus, default: SeriesStatus.DRAFT })
  status!: SeriesStatus;

  @Index()
  @Column({
    name: "type",
    type: "enum",
    enum: NovelType,
    default: NovelType.USER_GENERATED,
  })
  type!: NovelType;

  @Column({ name: "free_limit", type: "int", default: 0 })
  freeLimit!: number;

  @Column({ type: "int", default: 0 })
  chapterCount!: number;

  @Column({ type: "int", nullable: true })
  averageChapterWordCount!: number | null;

  @Column({ type: "float", default: 0 })
  rankingScore!: number;

  @Column({ type: "timestamp", nullable: true, default: null })
  lastChapterDate!: Date | null;

  @Index("IDX_novel_bannedUntil")
  @Column({ type: "timestamp", nullable: true, default: null })
  bannedUntil!: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  banReason!: string | null;

  @Column({ type: "boolean", default: false })
  isAdultContent!: boolean;

  @Index()
  @Column({ type: "uuid" })
  authorId!: string;

  @ManyToOne(() => Author, (author) => author.novels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author!: Author;

  @Column({ type: "int", default: 0 })
  viewCount!: number;

  @Column({ type: "int", default: 0 })
  positiveReviewsCount!: number;

  @Column({ type: "int", default: 0 })
  totalReviewsCount!: number;

  @Column({ type: "int", default: 0 })
  totalLibraryCount!: number;

  @Column({ type: "decimal", precision: 10, scale: 4, default: 0 })
  weeklyRankingScore!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Chapter, (chapter) => chapter.novel)
  chapters?: Chapter[];

  @OneToMany(() => Comment, (comment) => comment.novel)
  comments?: Comment[];

  @ManyToMany(() => Category, (category) => category.novels)
  @JoinTable({ name: "novel_categories" })
  categories?: Category[];

  @ManyToMany(() => Tags, (tags) => tags.novels, { onDelete: "CASCADE" })
  @JoinTable({ name: "novel_tags" })
  tags?: Tags[];

  @OneToMany(() => Library, (library) => library.novel)
  library!: Library[];

  @OneToMany(() => Volume, (volume) => volume.novel)
  volumes!: Volume[];

  @OneToMany(() => NovelDailyStats, (stats) => stats.novel)
  dailyStats!: NovelDailyStats[];
}
