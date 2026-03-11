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
import { SeriesStatus } from "../constants/series.constants.js";
import { Comment } from "./Comment.js";
import { User } from "./User.js";
import { Chapter } from "./Chapter.js";
import { Category } from "./Category.js";
import { Tags } from "./Tags.js";
import { Library } from "./Library.js";
import { Volume } from "./Volume.js";

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
  coverImage?: string;

  @Column({ type: "varchar", length: "1500", nullable: true })
  synopsis?: string;

  @Index()
  @Column({ type: "enum", enum: SeriesStatus, default: SeriesStatus.DRAFT })
  status!: SeriesStatus;

  @Index()
  @Column({ type: "uuid" })
  authorId!: string;

  @ManyToOne(() => User, (user) => user.novels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author!: User;

  @Column({ type: "int", default: 0 })
  viewCount!: number;

  @Column({ type: "int", default: 0 })
  positiveReviewsCount!: number;

  @Column({ type: "int", default: 0 })
  totalReviewsCount!: number;

  @Index()
  @Column({ type: "float", default: 0, select: false })
  popularityScore: number = 0;

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
}
