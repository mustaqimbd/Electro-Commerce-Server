import { hash256 } from "./hash256";

export const CApiHash = (input: string): string => {
  input.toLowerCase().trim().split(" ").join("");
  return hash256(input);
};
