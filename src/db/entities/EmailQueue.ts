import { Field } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { environ } from "../../common/env";
import type { UserAccount } from "./UserAccount";

export enum EmailStatus {
  IN_QUEUE = "IN_QUEUE",
  IN_PROGRESS = "IN_PROGRESS",
  SENT = "SENT",
  FAILED = "FAILED",
}

export class EmailAttachment {
  @Column({ name: "filename" })
  filename: string;

  @Column({ name: "filepath" })
  filepath: string;

  @Column({ name: "delete_file_on_success" })
  delete_file_on_success: string;
}

@Entity({ name: "email_queue" })
export class EmailQueue extends BaseEntity {
  @PrimaryGeneratedColumn("identity", { name: "id" })
  id: number;

  @Column({ name: "from", length: 255 })
  from: string;

  @Column({ name: "to", type: "varchar", length: 255, array: true })
  to: string[];

  @Column({ name: "cc", type: "varchar", length: 255, array: true, default: [] })
  cc: string[];

  @Column({ name: "bcc", type: "varchar", length: 255, array: true, default: [] })
  bcc: string[];

  @Column({ name: "subject", type: "text" })
  subject: string;

  @Column({ name: "html", type: "text" })
  html: string;

  @Column({ name: "text_content", type: "text" })
  text_content: string;

  @Column(() => EmailAttachment, { array: true })
  attachments: EmailAttachment[];

  @Column({
    name: "status",
    type: "enum",
    enum: EmailStatus,
    enumName: "email_status",
    default: EmailStatus.IN_QUEUE,
  })
  status: EmailStatus;

  @Column({ name: "status_description", type: "text", default: "" })
  status_description: string;

  @Column({ name: "attempts_remaining", type: "int2", unsigned: true, default: 3 })
  attempts_remaining: number;

  @Field(() => Date)
  @CreateDateColumn()
  created_at: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updated_at: Date;

  public static async scheduleActivateUserAccountEmail(
    account: UserAccount,
    code: string,
  ): Promise<EmailQueue> {
    const created = await EmailQueue.create({
      from: environ.SMTP_FROM,
      to: [account.email],
      subject: "Account Activation Email",
      html: `<h1>Welcome ${account.full_name}.</h1><br/><p>Your account activation code is: ${code}</p>`,
      text_content: `Welcome ${account.full_name}. Your account activation code is: ${code}`,
      attachments: [],
    }).save();

    return created;
  }

  public static async schedulePasswordResetEmail(
    account: UserAccount,
    code: string,
  ): Promise<EmailQueue> {
    const created = await EmailQueue.create({
      from: environ.SMTP_FROM,
      to: [account.email],
      subject: "Reset Password Email",
      html: `<h1>Hello ${account.full_name}.</h1><br/><p>Your password reset code is: ${code}</p>`,
      text_content: `Welcome ${account.full_name}. Your password reset code is: ${code}`,
      attachments: [],
    }).save();

    return created;
  }
}
