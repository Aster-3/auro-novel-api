import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SeriesStatus } from "../constants/series.constants.js";
import { Comment } from "./Comment.js";
import { User } from "./User.js";
import { Chapter } from "./Chapter.js";
import { Category } from "./Category.js";
import { Tags } from "./Tags.js";
import { Library } from "./Library.js";

@Entity()
export class Novel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 50, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  coverImage?: string;

  @Column({ type: "varchar", length: "700", nullable: true })
  synopsis?: string;

  @Index()
  @Column({ type: "enum", enum: SeriesStatus, default: SeriesStatus.DRAFT })
  status!: SeriesStatus;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "authorId" })
  author!: User;

  @OneToMany(() => Chapter, (chapter) => chapter.novel)
  chapters?: Chapter[];

  @OneToMany(() => Comment, (comment) => comment.novel)
  comments?: Comment[];

  @ManyToMany(() => Category, (category) => category.novel)
  @JoinTable({ name: "novel_categories" })
  categories?: Category[];

  @ManyToMany(() => Tags, (tags) => tags.novel)
  @JoinTable({ name: "novel_tags" })
  tags?: Tags[];

  @OneToMany(() => Library, (library) => library.novel)
  library!: Library[];

  @Index()
  @Column({ type: "float", default: 0, select: false })
  popularityScore: number = 0;
}
