import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const env = process.env;

export default {
  env: env.NODE_ENV,
  port: env.PORT,
  DBUrl: env.DB_URL,
};
