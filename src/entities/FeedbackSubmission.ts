import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import {
  FeedbackSubmissionStatus,
  FeedbackSubmissionType,
} from "../constants/feedback.constants.js";
import { User } from "./User.js";

@Entity()
export class FeedbackSubmission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user?: User | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email?: string | null;

  @Column({ type: "enum", enum: FeedbackSubmissionType })
  type!: FeedbackSubmissionType;

  @Column({
    type: "enum",
    enum: FeedbackSubmissionStatus,
    default: FeedbackSubmissionStatus.PENDING,
  })
  status!: FeedbackSubmissionStatus;

  @Column({ type: "varchar", length: 120 })
  subject!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({
    type: "jsonb",
    nullable: true,
    transformer: {
      to: (value: any) => value,
      from: (value: any) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      },
    },
  })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
