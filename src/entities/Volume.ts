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
@Index(["novelId", "orderIndex"], { unique: true })
export class Volume {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  name!: string | null;

  @Column({ type: "text", nullable: true })
  coverImage!: string | null;

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

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.volumes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @OneToMany(() => Chapter, (chapter) => chapter.volume)
  chapters!: Chapter[];
}
