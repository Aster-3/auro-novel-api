import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { SeriesStatus } from "../constants/series.constants.js";
import { Comment } from "./Comment.js";
import { User } from "./User.js";
import { Chapter } from "./Chapter.js";
import { Category } from "./Category.js";
import { Tags } from "./Tags.js";

@Entity()
export class Novel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: "700" })
  synopsis!: string;

  @Column({ type: "enum", enum: SeriesStatus })
  status!: SeriesStatus;

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "authorId" })
  author!: User;

  @OneToMany(() => Chapter, (chapter) => chapter.novel)
  chapters!: Chapter[];

  @OneToMany(() => Comment, (comment) => comment.novel)
  comments!: Comment[];

  @ManyToMany(() => Category, (category) => category.novel)
  @JoinTable({ name: "novel_categories" })
  categories!: Category[];

  @ManyToMany(() => Tags, (tags) => tags.novel)
  @JoinTable({ name: "novel_tags" })
  tags!: Tags[];
}
