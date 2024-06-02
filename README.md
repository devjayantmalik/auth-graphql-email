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
6. [EmailJS](https://www.npmjs.com/package/emailjs?activeTab=readme) (We faced issues, it didn't work, so we used nodemailer instead)
7. [PostgreSQL](https://www.postgresql.org/)

## Steps

1. Create new Project & Install dependencies
2. Setup Typeorm with UserAccount table to start with.
3. Setup GraphQL Yoga for GraphQL server.
4. Setup KeyDB
5. Setup Utilities for Sending Email
6. Create UserAccountsResolver in GraphQL
7. Create Authorization Guard for GraphQL-Yoga server
8. Create DemoResolver to demonstrate Authentication & Authorization

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

6. Create `.env` files. Here are contents of all 2 files out of 3 files, (.env.sample, .env.development, .env.production)

```text
# .env.sample
HOST=127.0.0.1
PORT=4000
DB_URL="postgres://<username>:<password>@localhost:5432/<database-name>"
REDIS_URL="redis://<username>:<password>@localhost:6379/<database-name>"
SMTP_HOST="smtp.ethereal.email"
SMTP_USERNAME="amelie.beer@ethereal.email"
SMTP_PASSWORD="PhPupn9RvDySGn4PQK"
SMTP_FROM="Authentication <no-reply@example.com>"
SMTP_SECURE=1

# .env.development
HOST=0.0.0.0
PORT=4000
DB_URL="postgres://postgres:testpassword@localhost:5432/authentication"
REDIS_URL="redis://localhost:6379/authentication"
SMTP_HOST="smtp.ethereal.email"
SMTP_USERNAME="amelie.beer@ethereal.email"
SMTP_PASSWORD="PhPupn9RvDySGn4PQK"
SMTP_FROM="Authentication <no-reply@example.com>"
SMTP_SECURE=1
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

1. Start KeyDB database server container

```shell
docker run --name some-keydb -d --network=host eqalpha/keydb keydb-server /etc/keydb/keydb.conf --requirepass Password123
```

2. Create a new file at `src/db/redis.ts` with following contents:

```typescript
import Redis from "ioredis";
import { environ } from "../common/env";
import { customAlphabet } from "nanoid";

const random_code = customAlphabet("0123456789", 6);

export class CustomRedis extends Redis {
  public async createActivationCode(email: string): Promise<string> {
    const code = random_code();
    await this.set(`account_activation_${email}`, code, "EX", 60 * 5); // expires after 5 minutes

    return code;
  }

  public async isActivationCodeValid(email: string, code: string): Promise<boolean> {
    const found_code = await this.get(`account_activation_${email}`);
    if (!found_code || found_code !== code) return false;

    return true;
  }
}

export const redisClient = new CustomRedis(environ.REDIS_URL);
```

3. Update `src/common/env.ts` file to contain REDIS_URL configuration

```typescript
export const environ = {
  HOST: process.env.HOST || "127.0.0.1",
  PORT: Number(process.env.PORT) || 4000,
  DB_URL: process.env.DB_URL!,
  REDIS_URL: process.env.REDIS_URL!, // <- add this line
} as const;
```

### 5. Setup Utilities for Sending Email

1. Update contents of `src/common.env.ts` as follows:

```typescript
export const environ = {
  HOST: process.env.HOST || "127.0.0.1",
  PORT: Number(process.env.PORT) || 4000,
  DB_URL: process.env.DB_URL!,
  REDIS_URL: process.env.REDIS_URL!,

  // Related to Email <- add this section
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_USERNAME: process.env.SMTP_USERNAME!,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
  SMTP_FROM: process.env.SMTP_FROM!,
  SMTP_SECURE: !!process.env.SMTP_SECURE!,
} as const;
```

2. Create a file at `src/common/sendEmail.ts` with following contents:

```typescript
// EmailJS: code didn't work for us
// import { SMTPClient, type MessageAttachment } from "emailjs";
// import { environ } from "./env";

// const client = new SMTPClient({
//   host: environ.SMTP_HOST,
//   user: environ.SMTP_USERNAME,
//   password: environ.SMTP_PASSWORD,
//   ssl: environ.SMTP_SECURE,
// });

// export interface ISendEmailOptions {
//   from?: string | string[];
//   cc?: string | string[];
//   bcc?: string | string[];
//   attachment?: MessageAttachment | MessageAttachment[];
//   to: string | string[];
//   subject: string;
//   content: string | null;
// }

// export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
//   await client.sendAsync({
//     from: options.from || environ.SMTP_FROM,
//     cc: options.cc,
//     bcc: options.bcc,
//     attachment: options.attachment,
//     to: options.to,
//     subject: options.subject,
//     text: options.content,
//   });
// };

import { createTransport } from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer/index";
import { environ } from "./env";

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
  content: string;
}

export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
  await client.sendMail({
    from: options.from || environ.SMTP_FROM,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
    to: options.to,
    subject: options.subject,
    text: options.content,
    html: options.content,
  });
};
```

### 6. Create UserAccountsResolver in GraphQL

Here is a list of features that our UserAccounts Resolver will support:

1. Create new Account
2. Activate Account (via OTP sent on Email)
3. Login to existing account
4. Reset Password (Send Reset Password Email)
5. Update Password (Updates existing password with new one.)
6. Get Current Logged in User

#### 1. Let's start with creating new account.

1. Extend UserAccount from BaseEntity to use for database operations without repository pattern, and make few more changes to follow best practices. Replace contents of `src/db/entities/UserAccount.ts` with:

```typescript
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity({ name: "user_accounts" })
export class UserAccount extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("identity", { name: "id" })
  id: number;

  @Field(() => String, { name: "full_name" })
  @Column({ name: "full_name", length: 50 })
  full_name: string;

  @Field(() => String, { name: "email" })
  @Column({ name: "email", length: 50, unique: true })
  email: string;

  @Column({ name: "password", type: "text" })
  password: string;

  @Column({ name: "account_activated_at", type: "timestamp", nullable: true, default: null })
  account_activated_at?: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
```

2. Create a input for create account data. Create new file at `src/resolvers/accounts/dto/CreateAccountInput.ts` with following contents:

```typescript
import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateAccountInput {
  @Length(1, 30, { message: "Fullname is required and must contain atmost 30 characters." })
  @Field(() => String, { name: "full_name" })
  full_name: string;

  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(6, 30, { message: "Password must contain atleast 6 and atmost 30 characters" })
  @Field(() => String, { name: "password" })
  password: string;
}
```

3. Create Resolver. Create a new file at: `src/resolvers/accounts/CreateAccountResolver.ts` with following contents:

```typescript
import { Arg, Mutation, Resolver } from "type-graphql";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { CreateAccountInput } from "./dto/CreateAccountInput";
import argon2 from "argon2";
import { EmailQueue } from "../../db/entities/EmailQueue";

@Resolver()
export class CreateNewAccountResolver {
  @Mutation(() => Boolean, {
    name: "create_account",
    description: "Creates new account and sends activation email to provided email address.",
  })
  async create_account(
    @Arg("data", () => CreateAccountInput) data: CreateAccountInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.count({ where: { email: data.email } });
    if (!!exists) return true;

    // create new account with provided details
    const account = await UserAccount.save({
      full_name: data.full_name,
      email: data.email,
      password: await argon2.hash(data.password),
    });

    // generate activation code and schedule email
    const code = await redisClient.createActivationCode(account.email);
    await EmailQueue.scheduleActivateUserAccountEmail(account, code);

    return true;
  }
}
```

4. Update contents of `src/resolvers/index.ts` with below contents to add CreateNewAccount to resolvers list.

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";

export const AllResolvers: NonEmptyArray<Function> = [HealthResolver, CreateNewAccountResolver];
```

5. Add `src/db/entities/EmailQueue.ts` table to schedule emails to be sent.

```typescript
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
      html: `<h1>Welcome ${account.full_name}.<h1><br/><p>Your account activation code is: ${code}`,
      text_content: `Welcome ${account.full_name}. Your account activation code is: ${code}`,
      attachments: [],
    }).save();

    return created;
  }
}
```

6. Add `src/common/DateTime.ts` class for ease of use of Date and time.

```typescript
export class DateTime extends Date {
  addMinutes(minutes: number): DateTime {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
  }

  addHours(hours: number): DateTime {
    this.setHours(this.getHours() + hours);
    return this;
  }

  subtractMinutes(minutes: number): DateTime {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
  }
}
```

7. Update `src/index.ts` file to regularly send emails after every 5 seconds

```typescript
import "reflect-metadata";
import { MainDataSource } from "./db/data-source";
import { createYoga } from "graphql-yoga";
import { environ } from "./common/env";
import { buildSchema } from "type-graphql";
import { AllResolvers } from "./resolvers";
import { sendScheduledEmails } from "./common/sendEmail";

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

  // <- add this logic in file.
  // Send scheduled emails regularly. You can create seperate processes incase, you need to scale horizontally.
  setInterval(async () => {
    await sendScheduledEmails();
  }, 5000);
};
main().catch(console.error);
```

#### 2. Activate Account Resolver

1. Create a new file at `src/resolvers/accounts/dto/ActivateUserAccountInput.ts` with following contents:

```typescript
import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class ActivateUserAccountInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(4, 10, { message: "Invalid activation code" })
  @Field(() => String, { name: "activation_code" })
  activation_code: string;
}
```

2. Create new Resolver for activate user account at `src/resolvers/accounts/ActivateUserAccountResolver.ts` with following contents:

```typescript
import { Arg, Mutation, Resolver } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { ActivateUserAccountInput } from "./dto/ActivateUserAccountInput";

@Resolver()
export class ActivateUserAccountResolver {
  @Mutation(() => Boolean, {
    name: "activate_account",
    description: "Activates user account with provided verification code.",
  })
  async activate_account(
    @Arg("data", () => ActivateUserAccountInput) data: ActivateUserAccountInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) return true;

    // skip for invalid activation code
    if (!(await redisClient.isActivationCodeValid(exists.email, data.activation_code))) {
      return true;
    }

    // activate user account
    await UserAccount.update({ id: exists.id }, { account_activated_at: new DateTime() });
    return true;
  }
}
```

3. Add Resolver to resolvers list. Edit `src/resolvers/index.ts` with following contents:

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver, // <- add this line.
];
```

##### 3. Login to existing account

1. Create new file at `src/resolvers/accounts/dto/AuthenticateInput.ts` with following contents:

```typescript
import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class AuthenticateInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(6, 30, { message: "Invalid password provided." })
  @Field(() => String, { name: "password" })
  password: string;
}
```

2. Edit `src/db/entities/UserAccount.ts` to include auth_token and auth_token_expires_at fields as follows:

```typescript
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity({ name: "user_accounts" })
export class UserAccount extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("identity", { name: "id" })
  id: number;

  @Field(() => String, { name: "full_name" })
  @Column({ name: "full_name", length: 50 })
  full_name: string;

  @Field(() => String, { name: "email" })
  @Column({ name: "email", length: 50, unique: true })
  email: string;

  @Column({ name: "password", type: "text" })
  password: string;

  @Column({ name: "account_activated_at", type: "timestamp", nullable: true, default: null })
  account_activated_at?: Date;

  // <-- add this property
  @Column({ name: "auth_token", length: 10, default: "" })
  auth_token: string;

  // <-- add this property
  @Column({ name: "auth_token_expires_at", type: "timestamp", default: "now()" })
  auth_token_expires_at: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
```

3. Create new file `src/common/Random.ts` with following contents:

```typescript
import { customAlphabet } from "nanoid";

const alphabets = "ABCDEFGHIJLKMNOPQRSTUVWXYZ";
const numbers = "0123456789";
const authTokenCode = customAlphabet(alphabets.toUpperCase() + alphabets.toLowerCase() + numbers);

export const Random = {
  createAuthToken(): string {
    return authTokenCode(10);
  },
};
```

3. Create new file at `src/resolvers/accounts/AuthenticateResolver.ts` with following contents:

```typescript
import argon2 from "argon2";
import { Arg, Mutation, Resolver } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { Random } from "../../common/Random";
import { UserAccount } from "../../db/entities/UserAccount";
import { AuthenticateInput } from "./dto/AuthenticateInput";

@Resolver()
export class AuthenticateResolver {
  @Mutation(() => UserAccount, {
    name: "authenticate",
    description: "Checks accounts credentials and returns auth token.",
  })
  async authenticate(
    @Arg("data", () => AuthenticateInput) data: AuthenticateInput,
  ): Promise<UserAccount> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) throw new Error("Invalid credentials provided.");

    // check password
    if (!(await argon2.verify(exists.password, data.password)))
      throw new Error("Invalid credentials provided.");

    // update auth token
    exists.auth_token = Random.createAuthToken();
    exists.auth_token_expires_at = new DateTime().addHours(2);
    const updated = await exists.save();

    return updated;
  }
}
```

4. Add Authenticate resolver to available to list of resolvers. Edit `src/resolvers/index.ts` with below contents:

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";
import { AuthenticateResolver } from "./accounts/AuthenticateResolver"; // <-- add this line

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
  AuthenticateResolver, // <-- add this line
];
```

##### 4. Reset Password (Send Reset Password Email)

1. Create a new file `src/resolvers/accounts/dto/ResetPasswordInput.ts` with below contents:

```typescript
import { IsEmail } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class ResetPasswordInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;
}
```

2. Edit `src/common/Random.ts` with below contents:

```typescript
import { customAlphabet } from "nanoid";

const alphabets = "ABCDEFGHIJLKMNOPQRSTUVWXYZ";
const numbers = "0123456789";
const authTokenCode = customAlphabet(alphabets.toUpperCase() + alphabets.toLowerCase() + numbers);
const numericCode = customAlphabet(numbers);

export const Random = {
  createAuthToken(): string {
    return authTokenCode(10);
  },

  createNumericCode(size: number = 6) {
    return numericCode(size);
  },
};
```

3. Edit `src/db/redis.ts` with below contents:

```typescript
import Redis from "ioredis";
import { environ } from "../common/env";
import { customAlphabet } from "nanoid";
import { Random } from "../common/Random";

const random_code = customAlphabet("0123456789", 6);

export class CustomRedis extends Redis {
  public async createActivationCode(email: string): Promise<string> {
    const code = random_code();
    await this.set(`account_activation_${email}`, code, "EX", 60 * 5); // expires after 5 minutes

    return code;
  }

  public async isActivationCodeValid(email: string, code: string): Promise<boolean> {
    const found_code = await this.get(`account_activation_${email}`);
    if (!found_code || found_code !== code) return false;

    // expire current code
    await this.del(`account_activation_${email}`);

    return true;
  }

  public async createResetPasswordCode(email: string): Promise<string> {
    const code = Random.createNumericCode();
    await this.set(`passcode_reset_${email}`, code, "EX", 60 * 5);

    return code;
  }

  public async isResetPasswordCodeValid(email: string, code: string): Promise<boolean> {
    const found_code = await this.get(`passcode_reset_${email}`);
    if (!found_code || found_code !== code) return false;

    // expire current code
    await this.del(`passcode_reset_${email}`);
    return true;
  }
}

export const redisClient = new CustomRedis(environ.REDIS_URL);
```

4. Create new file `src/resolvers/accounts/ResetPasswordResolver.ts` with below contents:

```typescript
import { Arg, Mutation, Resolver } from "type-graphql";
import { EmailQueue } from "../../db/entities/EmailQueue";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { ResetPasswordInput } from "./dto/ResetPasswordInput";

@Resolver()
export class ResetPasswordResolver {
  @Mutation(() => Boolean, {
    name: "reset_password",
    description: "Sends a reset password email with verification code.",
  })
  async reset_password(
    @Arg("data", () => ResetPasswordInput) data: ResetPasswordInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) return true;

    // generate password reset code
    const code = await redisClient.createResetPasswordCode(exists.email);
    await EmailQueue.schedulePasswordResetEmail(exists, code);

    return true;
  }
}
```

5. Edit `src/resolvers/index.ts` with below contents:

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";
import { AuthenticateResolver } from "./accounts/AuthenticateResolver";
import { ResetPasswordResolver } from "./accounts/ResetPasswordResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
  AuthenticateResolver,
  ResetPasswordResolver,
];
```

##### 5. Update Password (Updates existing password with new one.)

1. Create new file at: `src/resolvers/accounts/dto/UpdatePasswordInput.ts` with below contents:

```typescript
import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpdatePasswordInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(6, 10, { message: "Invalid verification code" })
  @Field(() => String, { name: "verification_code" })
  verification_code: string;

  @Length(6, 30, { message: "Password must contain atleast 6 and atmost 30 characters" })
  @Field(() => String, {
    name: "password",
    description: "Updated password to set on user account.",
  })
  password: string;
}
```

2. Create new file at `src/resolvers/accounts/UpdatePasswordResolver.ts` with below contents:

```typescript
import argon2 from "argon2";
import { Arg, Mutation, Resolver } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { UpdatePasswordInput } from "./dto/UpdatePasswordInput";

@Resolver()
export class UpdatePasswordResolver {
  @Mutation(() => Boolean, {
    name: "update_password",
    description: "Updates password for a user account with email and verification code",
  })
  async update_password(
    @Arg("data", () => UpdatePasswordInput) data: UpdatePasswordInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) return true;

    // check if activation code is valid
    const isValid = await redisClient.isResetPasswordCodeValid(
      exists.email,
      data.verification_code,
    );
    if (!isValid) throw new Error("Invalid activation code provided.");

    // update password for valid activation code
    await UserAccount.update(
      { id: exists.id },
      { password: await argon2.hash(data.password), auth_token_expires_at: new DateTime() },
    );

    return true;
  }
}
```

3. Add Resolver to resolvers list. Edit `src/resolvers/index.ts` with below contents:

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";
import { AuthenticateResolver } from "./accounts/AuthenticateResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ResetPasswordResolver } from "./accounts/ResetPasswordResolver";
import { UpdatePasswordResolver } from "./accounts/UpdatePasswordResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
  AuthenticateResolver,
  ResetPasswordResolver,
  UpdatePasswordResolver, // <-- add this line.
];
```

##### 6. Get Current Logged in User

1. Create new file at `src/resolvers/accounts/WhoamiResolver.ts` with below contents:

```typescript
import type { YogaInitialContext } from "graphql-yoga";
import { Ctx, Query, Resolver } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { UserAccount } from "../../db/entities/UserAccount";

@Resolver()
export class WhoamiResolver {
  @Query(() => UserAccount, {
    name: "whoami",
    description: "Returns currently authenticated user based on Authorization header.",
    nullable: true,
  })
  async whoami(@Ctx() context: YogaInitialContext): Promise<UserAccount | null> {
    const token = context.request.headers.get("authorization");
    if (!token) return null;

    // check if auth_token is valid
    const account = await UserAccount.findOne({ where: { auth_token: token } });
    if (!account || account.auth_token_expires_at.getTime() <= new DateTime().getTime()) {
      return null;
    }

    // return account otherwise
    return account;
  }
}
```

2. Add resolver to resolvers list. Edit `src/resolvers/index.ts` with below contents:

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";
import { AuthenticateResolver } from "./accounts/AuthenticateResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ResetPasswordResolver } from "./accounts/ResetPasswordResolver";
import { UpdatePasswordResolver } from "./accounts/UpdatePasswordResolver";
import { WhoamiResolver } from "./accounts/WhoamiResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
  AuthenticateResolver,
  ResetPasswordResolver,
  UpdatePasswordResolver,
  WhoamiResolver, // <-- add this line
];
```

### 7. Create Authorization Guard for GraphQL-Yoga server

1. Edit `src/db/entities/UserAccount.ts` to include role field.

```typescript
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserAccountRole {
  Admin = "admin",
  Client = "client",
}

@ObjectType()
@Entity({ name: "user_accounts" })
export class UserAccount extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("identity", { name: "id" })
  id: number;

  @Field(() => String, { name: "full_name" })
  @Column({ name: "full_name", length: 50 })
  full_name: string;

  @Field(() => String, { name: "email" })
  @Column({ name: "email", length: 50, unique: true })
  email: string;

  @Column({ name: "password", type: "text" })
  password: string;

  @Column({
    name: "role",
    type: "enum",
    enum: UserAccountRole,
    enumName: "user_account_role",
    default: UserAccountRole.Client,
  })
  role: UserAccountRole;

  @Column({ name: "account_activated_at", type: "timestamp", nullable: true, default: null })
  account_activated_at?: Date;

  @Field(() => String, { name: "auth_token" })
  @Column({ name: "auth_token", length: 10, default: "" })
  auth_token: string;

  @Column({ name: "auth_token_expires_at", type: "timestamp", default: "now()" })
  auth_token_expires_at: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
```

2. Edit `src/middlewares/authChecker.ts` with below contents:

```typescript
import type { YogaInitialContext } from "graphql-yoga";
import type { AuthChecker } from "type-graphql";
import { UserAccount, type UserAccountRole } from "../db/entities/UserAccount";

export const authChecker: AuthChecker<YogaInitialContext, UserAccountRole> = async (
  { context },
  roles,
) => {
  const auth_token = context.request.headers.get("authorization");
  if (!auth_token) return false;

  // validate auth token
  const account = await UserAccount.findOne({ where: { auth_token: auth_token } });
  if (!account) return false;

  // check user role incase role is specified
  if (!!roles.length && !roles.includes(account.role)) return false;

  return true;
};
```

3. Edit `src/index.ts` to include authChecker with below contents:

```typescript
import "reflect-metadata";
import { MainDataSource } from "./db/data-source";
import { createYoga } from "graphql-yoga";
import { environ } from "./common/env";
import { buildSchema } from "type-graphql";
import { AllResolvers } from "./resolvers";
import { sendScheduledEmails } from "./common/sendEmail";
import { authChecker } from "./middlewares/authChecker";

const main = async (): Promise<void> => {
  // initialise database
  await MainDataSource.initialize();

  // configure and add graphql server as middleware
  const yoga = createYoga({
    schema: await buildSchema({ resolvers: AllResolvers, authChecker: authChecker }),
    graphiql: {
      credentials: "include",
    },
    graphqlEndpoint: "/graphql",
    landingPage: false,
  });

  Bun.serve({ fetch: yoga, hostname: environ.HOST, port: environ.PORT });
  console.log(`Server started at: http://${environ.HOST}:${environ.PORT}`);

  // Send scheduled emails regularly. You can create seperate processes incase, you need to scale horizontally.
  setInterval(async () => {
    await sendScheduledEmails();
  }, 10_000);
};
main().catch(console.error);
```

4. Edit `src/resolvers/WhoamiResolver.ts` with below contents to mark whoami resolver with isAuthenticated Resolver

```typescript
import type { YogaInitialContext } from "graphql-yoga";
import { Ctx, Query, Resolver, Authorized } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { UserAccount } from "../../db/entities/UserAccount";

@Resolver()
export class WhoamiResolver {
  @Authorized()
  @Query(() => UserAccount, {
    name: "whoami",
    description: "Returns currently authenticated user based on Authorization header.",
    nullable: true,
  })
  async whoami(@Ctx() context: YogaInitialContext): Promise<UserAccount | null> {
    const token = context.request.headers.get("authorization");
    if (!token) return null;

    // check if auth_token is valid
    const account = await UserAccount.findOne({ where: { auth_token: token } });
    if (!account || account.auth_token_expires_at.getTime() <= new DateTime().getTime()) {
      return null;
    }

    // return account otherwise
    return account;
  }
}
```

### 8. Create DemoResolver to demonstrate Authentication & Authorization

1. Create new file at `src/resolvers/demo/DemoResolver.ts` with below contents to check authentication and authorization

```typescript
import { Authorized, Query, Resolver } from "type-graphql";
import { UserAccountRole } from "../../db/entities/UserAccount";

@Resolver()
export class DemoResolver {
  @Query(() => Boolean, {
    name: "demo_public",
    description: "Returns true, irrespective of authentication or unauthenticated.",
  })
  demo_public(): boolean {
    return true;
  }

  @Authorized()
  @Query(() => Boolean, {
    name: "demo_authenticated",
    description: "Returns true, incase you are authenticated.",
  })
  demo_authenticated(): boolean {
    return true;
  }

  @Authorized(UserAccountRole.Admin)
  @Query(() => Boolean, {
    name: "demo_admin",
    description: "Returns true, only if you are authenticated and role is admin.",
  })
  demo_admin(): boolean {
    return true;
  }

  @Authorized(UserAccountRole.Client)
  @Query(() => Boolean, {
    name: "demo_client",
    description: "Returns true, only if you are authenticated and role is client.",
  })
  demo_client(): boolean {
    return true;
  }

  @Authorized(UserAccountRole.Admin, UserAccountRole.Client)
  @Query(() => Boolean, {
    name: "demo_admin_or_client",
    description: "Returns true, only if you are authenticated and role is either admin or client.",
  })
  demo_admin_or_client(): boolean {
    return true;
  }
}
```

2. Add Demo Resolver to list of resolvers. Edit `src/resolvers/index.ts` file with below contents:

```typescript
import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";
import { AuthenticateResolver } from "./accounts/AuthenticateResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ResetPasswordResolver } from "./accounts/ResetPasswordResolver";
import { UpdatePasswordResolver } from "./accounts/UpdatePasswordResolver";
import { WhoamiResolver } from "./accounts/WhoamiResolver";
import { DemoResolver } from "./demo/DemoResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
  AuthenticateResolver,
  ResetPasswordResolver,
  UpdatePasswordResolver,
  WhoamiResolver,
  DemoResolver,
];
```
