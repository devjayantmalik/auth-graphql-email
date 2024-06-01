# Authentication and Authorization with GraphQL

## Goal

We will build a simple application that can be used in production, for authentication and authorization. Here is the overall goal of this application:

- Authentication via Email and Password
- Account Activation via OTP sent on Email
- Role based Authorization
- Protected and Public GraphQL endpoints
- Well formatted errors with GraphQL
- Best practices to follow in production related to authentication.
- Minimal dependencies

## Technologies Used:

Here is a list of dependencies and binaries required for this application.

1. [Bun](https://bun.sh/docs/installation)/[NodeJS](https://nodejs.org/en) (we selected bun-1.1.8) and we tested on node(21.x). We recommend to choose latest versions.
2. [Typeorm](https://typeorm.io/)
3. [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server/docs)
4. [Type GraphQL](https://typegraphql.com/docs/installation.html)
5. [KeyDB/Redis](https://docs.keydb.dev/docs/) (We went with KeyDB as Redis is no longer opensource)
6. [EmailJS](https://www.npmjs.com/package/emailjs?activeTab=readme)
7. [PostgreSQL](https://www.postgresql.org/)

## Steps

1. Create new Project & Install dependencies
2. Setup Typeorm with UserAccount table to start with.
3. Setup GraphQL Yoga for GraphQL server.
4. Setup KeyDB
5. Setup Utilities for Sending Email
6. Create UserAccountsResolver in GraphQL
7. Swap ExpressJS with NodeJS/Bun HTTP Module

### 1. Create new Project & Install dependencies.

1. Create new project

```shell
# Just press enter for all prompts after this command
bun init
```

This will provide us following directory structure. You will also see _node_modules_ directory, but we ignored it to include here.

```txt
.
├── bun.lockb
├── index.ts
├── package.json
├── README.md
└── tsconfig.json

0 directories, 5 files

```

2. Move index.ts file to src/index.ts path, as we will keep everything in src directory.

```shell
mkdir src
mv index.ts src/index.ts
```

3. Update contents of tsconfig.json to match our custom rules.(Optional)

```json
{
  "compilerOptions": {
    // Enable latest features
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext"],
    "skipLibCheck": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",

    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": false,
    "noEmit": false,

    // Best practices
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    // Decorators and imports
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules"],
  "include": ["./src/**/*.ts"]
}
```

4. Install dependencies and configure scripts in package.json file (You can omit fields such as name, description, version etc.)

```json
{
  "name": "auth-graphql",
  "version": "1.0.0",
  "description": "Authentication and Authorization with GraphQL",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development bun run --hot --env-file .env.development src/index.ts",
    "start": "NODE_ENV=production bun run --env-file .env.production src/index.ts"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/express": "^4.17.21",
    "@types/node": "^20.13.0",
    "typescript": "5.4.5"
  },
  "dependencies": {
    "argon2": "^0.40.3",
    "emailjs": "^4.0.3",
    "graphql": "^16.8.1",
    "graphql-yoga": "^5.3.1",
    "ioredis": "^5.4.1",
    "nanoid": "^5.0.7",
    "pg": "^8.11.5",
    "reflect-metadata": "^0.2.2",
    "typeorm": "0.3.20"
  },
  "prettier": {
    "printWidth": 100,
    "bracketSameLine": true,
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf",
    "useTabs": false,
    "tabWidth": 2,
    "trailingComma": "all",
    "semi": true,
    "quoteProps": "consistent",
    "singleQuote": false,
    "singleAttributePerLine": false
  }
}
```

> Execute `bun install` to install dependencies from package.json file we just created.

5. Create a file at `src/common/env.ts` to store environment variables.

```typescript
export const environ = {
  HOST: process.env.HOST || "127.0.0.1",
  PORT: Number(process.env.PORT) || 4000,
  DB_URL: process.env.DB_URL,
} as const;
```

6. Create `.env` files. Here are contents of all 3 files, (.env.sample, .env.development, .env.production)

```text
# .env.sample
HOST=127.0.0.1
PORT=4000
DB_URL="postgres://<username>:<password>@localhost:5432/<database-name>"


# .env.development
HOST=127.0.0.1
PORT=4000
DB_URL="postgres://postgres:testpassword@localhost:5432/authentication"

# .env.production (change contents accordingly of this file.)
HOST=127.0.0.1
PORT=4000
DB_URL="postgres://postgres:testpassword@localhost:5432/authentication"
```

6. Here are contents of `.gitignore` file incase you need to omit .env files (Optional)

```txt
.idea/
.vscode/
node_modules/
build/
tmp/
temp/

dist/
.env.production
```

### 2. Setup Typeorm and Postgres

We assume, you have postgres server installed and running on you local development machine. You can start by creating a database for your application(In our case we are naming our database **authentication**. You can choose any database name)

To create a database you can execute below command in SQL editor

```sql
-- Replace authentication with your database name.
CREATE DATABASE authentication;
```

or You can also execute below command in your terminal to create new postgres database:

```sql
createdb authentication
```

1. Create `src/db/data-source.ts` file with following contents:

```typescript
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
```

2. Create `src/db/entities/UserAccount.ts` file with following contents:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import argon2 from "argon2";

@Entity({ name: "user_accounts" })
export class UserAccount {
  @PrimaryGeneratedColumn("identity", { name: "id" })
  id: number;

  @Column({ name: "full_name", length: 50 })
  full_name: string;

  @Column({ name: "email", length: 50 })
  email: string;

  @Column({ type: "text" })
  password: string;

  @Column({ type: "timestamptz", nullable: true, default: null })
  account_activated_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }
}
```

3. Replace contents of `src/index.ts` file with following contents:

```typescript
import "reflect-metadata";
import { MainDataSource } from "./db/data-source";

const main = async (): Promise<void> => {
  // connect to database
  await MainDataSource.initialize();
};
main().catch(console.error);
```

With above setup you should be able to run `bun run dev` and test out our application.
It will create database tables, and synchronise them immediately as we have synchronise flag turned on in `src/db/data-source.ts` file.

> You must disable synchronise flag in `src/db/data-source.ts` and switch to migration mode in production.

### 3. Setup GraphQL Yoga server

1. Replace contents of `src/index.ts` file to integrate graphql server code.

```typescript
import "reflect-metadata";
import { MainDataSource } from "./db/data-source";
import { createYoga } from "graphql-yoga";
import { environ } from "./common/env";
import { buildSchema } from "type-graphql";
import { AllResolvers } from "./resolvers";

const main = async (): Promise<void> => {
  // initialise database
  await MainDataSource.initialize();

  // configure and add graphql server as middleware
  const yoga = createYoga({
    schema: await buildSchema({ resolvers: AllResolvers }),
    graphiql: {
      credentials: "include",
    },
    graphqlEndpoint: "/graphql",
    landingPage: false,
  });

  Bun.serve({ fetch: yoga, hostname: environ.HOST, port: environ.PORT });
  console.log(`Server started at: http://${environ.HOST}:${environ.PORT}`);
};
main().catch(console.error);
```

2. Create new file at `src/resolvers/index.ts` with following contents:

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";

export const AllResolvers: NonEmptyArray<Function> = [HealthResolver];
```

3. Create new file at `src/resolvers/HealthResolver.ts` with following contents:

```typescript
import { Query, Resolver } from "type-graphql";

@Resolver()
export class HealthResolver {
  @Query(() => Boolean)
  health(): Boolean {
    return true;
  }
}
```

> You can now test your graphql server. Start your server using `bun run dev` and visit [http://localhost:4000/graphql](http://localhost:4000/graphql) to see graphql playground and execute queries

### 4. Setup KeyDB

KeyDB is compatible with Redis, so any redis client package will work with KeyDB as per the [documentation](https://docs.keydb.dev/docs/compatibility). We will use ioredis client to interact with keydb server. And for this project, we will start a docker container of keydb just to build our application. You should swap Docker container KeyDB URL with your production server URL, when running your app in production.

1.
