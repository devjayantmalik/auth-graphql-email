export const environ = {
  HOST: process.env.HOST || "127.0.0.1",
  PORT: Number(process.env.PORT) || 4000,
  DB_URL: process.env.DB_URL,
} as const;
