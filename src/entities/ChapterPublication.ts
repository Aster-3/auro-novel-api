// import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
// import { Chapter } from "./Chapter.js";

// @Entity()
// export class ChapterPublication {

//     @PrimaryGeneratedColumn("uuid")
//     id!: string;

//      @Column({
//         type: "decimal",
//         precision: 6,
//         scale: 2,
//         default: 1.0,
//         transformer: {
//           to: (value: number) => value,
//           from: (value: string) => parseFloat(value),
//         },
//       })
//       orderIndex!: number;

//       @Column({type: "uuid", nullable: false})
//         chapterId!: string;

//     @OneToOne(() => Chapter, (chapter) => chapter.publication, {
//         onDelete: "CASCADE",
//     })
//     chapter!: Chapter;
// }
