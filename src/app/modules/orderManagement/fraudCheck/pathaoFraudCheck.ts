/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import ApiError from "../../../errorHandlers/ApiError";
import config from "../../../config/config";

const API_BASE_URL = "https://merchant.pathao.com";

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
    console.error("Error when checking pathao login status:", error);
    return false;
  }
}

// ✅ Login with password and store token
async function login() {
  try {
    const response = await session.post("/api/v1/login", {
      username: config.pathao.username,
      password: config.pathao.password,
    });
    const accessToken = response.data.access_token;
    session.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    console.log("2. Pathao login successful.");
  } catch (error: any) {
    console.error("Pathao login failed:", error);
    throw new ApiError(
      400,
      `Pathao login failed. ${error.response?.data || error.message}`
    );
  }
}

const pathaoFraudCheck = async (phone: string) => {
  try {
    if (!(await isLoggedIn())) {
      await login();
    }

    const response = await session.post("/api/v1/user/success", { phone });
    return response.data;
  } catch (error: any) {
    console.error("Error when pathao fraud check:", error);
    throw new ApiError(
      400,
      `Failed to check pathao fraud. ${error.response?.data || error.message}`
    );
  }
};

export { pathaoFraudCheck };
