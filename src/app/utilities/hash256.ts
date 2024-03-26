import crypto from "crypto";

export const hash256 = (input: string): string => {
  return crypto.createHash("sha256").update(input).digest("hex");
};
