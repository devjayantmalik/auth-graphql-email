import { DataSource } from "typeorm";
import path from "path";
import { fileURLToPath } from "url";
import { environ } from "../common/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const MainDataSource = new DataSource({
  type: "postgres",
  url: environ.DB_URL,
  synchronize: true,
  logging: true,
  entities: [path.join(__dirname, "entities", "*.*")],
  migrations: [path.join(__dirname, "migrations", "*.*")],
  subscribers: [],
});
