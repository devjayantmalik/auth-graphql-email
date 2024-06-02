import { customAlphabet } from "nanoid";

const alphabets = "ABCDEFGHIJLKMNOPQRSTUVWXYZ";
const numbers = "0123456789";
const authTokenCode = customAlphabet(alphabets.toUpperCase() + alphabets.toLowerCase() + numbers);

export const Random = {
  createAuthToken(): string {
    return authTokenCode(10);
  },
};
