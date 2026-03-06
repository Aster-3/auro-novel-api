import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Novel } from "./Novel.js";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @ManyToMany(() => Novel, (novel) => novel.categories, {
    nullable: false,
    onDelete: "CASCADE",
  })
  novel!: Novel[];
}
