import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { Volume } from "./Volume.js";

@Entity()
@Index(["novelId", "order"], { unique: true })
export class Chapter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "int" })
  order!: number;

  @Column({ type: "boolean", default: false })
  isPublished!: boolean;

  @CreateDateColumn()
  createAt!: Date;

  @UpdateDateColumn()
  updateAt!: Date;

  @Column({ type: "uuid" })
  novelId!: string;

  @ManyToOne(() => Novel, (novel) => novel.chapters, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Column({ type: "uuid", nullable: true })
  volumeId!: string | null;

  @ManyToOne(() => Volume, (volume) => volume.chapters, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "volumeId" })
  volume!: Volume | null;
}
