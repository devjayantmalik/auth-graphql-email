import { SMTPClient, type MessageAttachment } from "emailjs";
import { environ } from "./env";

const client = new SMTPClient({
  host: environ.SMTP_HOST,
  user: environ.SMTP_USERNAME,
  password: environ.SMTP_PASSWORD,
  ssl: environ.SMTP_SECURE,
});

export interface ISendEmailOptions {
  from?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachment?: MessageAttachment | MessageAttachment[];
  to: string | string[];
  subject: string;
  content: string | null;
}

export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
  await client.sendAsync({
    from: options.from || environ.SMTP_FROM,
    cc: options.cc,
    bcc: options.bcc,
    attachment: options.attachment,
    to: options.to,
    subject: options.subject,
    text: options.content,
  });
};
