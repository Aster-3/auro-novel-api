import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
} from "typeorm";
import { Comment } from "./Comment.js";
import { CommentLike } from "./CommentLike.js";
import { Novel } from "./Novel.js";
import { Tags } from "./Tags.js";
import { Library } from "./Library.js";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 15, unique: true })
  username!: string;

  @Column({ type: "varchar", length: 20 })
  nickname!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "text", nullable: true })
  profileImageUrl?: string;

  @Column({ type: "text", nullable: true })
  profileBackgroundImageUrl?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string;

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => CommentLike, (commentLike) => commentLike.user)
  likes!: CommentLike[];

  @OneToOne(() => Novel, (novel) => novel.author)
  novel!: Novel;

  @ManyToOne(() => Tags, (tags) => tags.createdBy)
  tags!: Tags[];

  @OneToMany(() => Library, (library) => library.user)
  library!: Library[];
}
