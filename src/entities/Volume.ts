import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Chapter } from "./Chapter.js";
import { Novel } from "./Novel.js";

@Entity()
export class Volume {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "int", default: 1 })
  order!: number;

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.volumes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @OneToMany(() => Chapter, (chapter) => chapter.volume)
  chapters!: Chapter[];
}
