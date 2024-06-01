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

  // Send scheduled emails regularly. You can create seperate processes incase, you need to scale horizontally.
  setInterval(async () => {
    await sendScheduledEmails();
  }, 5000);
};
main().catch(console.error);
