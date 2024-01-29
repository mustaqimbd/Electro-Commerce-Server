import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const env = process.env;

export default {
  env: env.NODE_ENV,
  port: env.PORT,
  DBUrl: env.DB_URL,
  clientSideURL: env.CLIENT_SIDE_URL,
  bcrypt_salt_round: env.BCRYPT_SALT_ROUND,
  token_data: {
    access_token_secret: env.ACCESS_TOKEN_SECRET,
    refresh_token_secret: env.REFRESH_TOKEN_SECRET,
    access_token_expires: env.ACCESS_TOKEN_EXPIRES,
    customer_refresh_token_expires: env.CUSTOMER_REFRESH_TOKEN_EXPIRES,
    admin_staff_refresh_token_expires: env.ADMIN_STAFF_REFRESH_TOKEN_EXPIRES,
  },
  session_secret: env.SESSION_SECRET,
  session_expires: env.SESSION_EXPIRES,
  cart_item_expires: env.CART_ITEM_EXPIRES,
};
