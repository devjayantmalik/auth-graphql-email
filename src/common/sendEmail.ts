import { createTransport } from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer/index";
import { environ } from "./env";
import { EmailQueue, EmailStatus } from "../db/entities/EmailQueue";
import { In, LessThan, MoreThan } from "typeorm";
import { MainDataSource } from "../db/data-source";
import { DateTime } from "./DateTime";

const client = createTransport({
  host: environ.SMTP_HOST,
  port: environ.SMTP_PORT,
  secure: environ.SMTP_PORT === 465,
  auth: {
    user: environ.SMTP_USERNAME,
    pass: environ.SMTP_PASSWORD,
  },
});

export interface ISendEmailOptions {
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export const sendEmail = async <T = null>(
  options: ISendEmailOptions,
  what_to_return: T | null = null,
): Promise<{ data: T; success: boolean; status: string }> => {
  try {
    await client.sendMail({
      from: options.from || environ.SMTP_FROM,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return { data: what_to_return!, success: true, status: "Email sent successfully." };
  } catch (ex) {
    return { data: what_to_return!, success: false, status: ex.message };
  }
};

export const sendScheduledEmails = async (): Promise<void> => {
  // find emails InQueue and emails left InProgress state more than 5 minutes. OR failed emails with attempts remaining
  const emails = await EmailQueue.find({
    where: [
      { status: EmailStatus.IN_QUEUE },
      { status: EmailStatus.IN_PROGRESS, updated_at: LessThan(new DateTime().subtractMinutes(5)) },
      { status: EmailStatus.FAILED, attempts_remaining: MoreThan(0) },
    ],
    take: 50,
  });

  if (emails.length === 0) return;

  const results = await Promise.all(
    emails.map((email) =>
      sendEmail(
        {
          to: email.to,
          from: email.from,
          text: email.text_content,
          html: email.html,
          subject: email.subject,
          cc: email.cc,
          bcc: email.bcc,
          attachments: email.attachments,
        },
        email,
      ),
    ),
  );

  // update success and failure emails
  await MainDataSource.transaction(async (txn) => {
    // set failed or success transactions
    for (const item of results) {
      if (item.success) {
        txn.update(
          EmailQueue,
          { id: item.data.id },
          { status: EmailStatus.SENT, status_description: item.status },
        );
      } else {
        txn.update(
          EmailQueue,
          { id: item.data.id },
          {
            status: EmailStatus.FAILED,
            status_description: item.status,
            attempts_remaining: item.data.attempts_remaining - 1,
          },
        );
      }
    }
  });
};
