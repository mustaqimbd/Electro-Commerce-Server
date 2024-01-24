/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { TJwtPayload } from "../modules/auth/auth.interface";

declare global {
  namespace Express {
    interface Request {
      user: TJwtPayload | null;
    }
  }
}
