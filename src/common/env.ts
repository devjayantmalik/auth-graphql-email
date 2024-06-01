export const environ = {
  HOST: process.env.HOST || "127.0.0.1",
  PORT: Number(process.env.PORT) || 4000,
  DB_URL: process.env.DB_URL!,
  REDIS_URL: process.env.REDIS_URL!,

  // Related to Email
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_USERNAME: process.env.SMTP_USERNAME!,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
  SMTP_FROM: process.env.SMTP_FROM!,
  SMTP_SECURE: !!process.env.SMTP_SECURE!,
} as const;
