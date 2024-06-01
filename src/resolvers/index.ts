import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";

export const AllResolvers: NonEmptyArray<Function> = [HealthResolver, CreateNewAccountResolver];
