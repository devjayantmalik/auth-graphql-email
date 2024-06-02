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
