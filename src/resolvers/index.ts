import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";

export const AllResolvers: NonEmptyArray<Function> = [HealthResolver];
