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
