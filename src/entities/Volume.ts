import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Chapter } from "./Chapter.js";
import { Novel } from "./Novel.js";

@Entity()
@Index(["novelId", "order"])
export class Volume {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  name!: string | null;

  @Column({ type: "float", default: 1 })
  order!: number;

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.volumes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @OneToMany(() => Chapter, (chapter) => chapter.volume)
  chapters!: Chapter[];
}
