/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import ApiError from "../../../errorHandlers/ApiError";
import config from "../../../config/config";

const API_BASE_URL = "https://go-app.paperfly.com.bd";

const cookieJar = new CookieJar();
const session = wrapper(
  axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    jar: cookieJar,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    },
  })
);

// ✅ Check if logged in (based on cookies)
async function isLoggedIn(): Promise<boolean> {
  try {
    const auth = session.defaults.headers.common["Authorization"];
    return !!auth;
  } catch (error) {
    console.error("Error when checking paperfly login status:", error);
    return false;
  }
}

// ✅ Login with password and store token
async function login() {
  try {
    const response = await session.post(
      "/merchant/api/react/authentication/login_using_password.php",
      {
        username: config.paperfly.username,
        password: config.paperfly.password,
      }
    );
    const accessToken = response.data.token;
    session.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    console.log("4. Paperfly login successful.");
  } catch (error: any) {
    console.error("Paperfly login failed:", error);
    throw new ApiError(
      400,
      `Failed to paperfly log in. ${error.response?.data || error.message}`
    );
  }
}

const paperFlyFraudCheck = async (phone: string) => {
  try {
    if (!(await isLoggedIn())) {
      await login();
    }
    const response = await session.post(
      "/merchant/api/react/smart-check/list.php?",
      {
        search_text: phone,
        limit: 50,
        page: 1,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error when paperfly fraud check:", error);
    throw new ApiError(
      400,
      `Failed to check paperfly fraud. ${error.response?.data || error.message}`
    );
  }
};

export { paperFlyFraudCheck };
