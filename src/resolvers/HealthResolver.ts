import { Query, Resolver } from "type-graphql";

@Resolver()
export class HealthResolver {
  @Query(() => Boolean, {
    name: "health",
    description: "Always returns true, can be used to monitor system online status",
  })
  health(): boolean {
    return true;
  }
}
