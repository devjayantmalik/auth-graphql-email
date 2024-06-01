import Redis from "ioredis";
import { environ } from "../common/env";

export const redisClient = new Redis(environ.REDIS_URL);
