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

@Entity()
export class EditorPick {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index("IDX_editor_pick_novelId")
  @Column({ type: "uuid", unique: true })
  novelId!: string;

  @ManyToOne(() => Novel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "novelId" })
  novel!: Novel;

  @Index()
  @Column({ type: "int", default: 0 })
  orderIndex!: number;

  @Index()
  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
