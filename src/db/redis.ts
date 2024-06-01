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
