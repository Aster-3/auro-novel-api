import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Novel } from "./Novel.js";

@Entity()
export class Chapter {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @ManyToOne(() => Novel, (novel) => novel.chapters, {
    nullable: false,
    onDelete: "CASCADE",
  })
  novel!: Novel;
}
