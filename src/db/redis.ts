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
