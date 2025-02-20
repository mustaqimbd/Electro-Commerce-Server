/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";
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
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status || 500; // Default to 500 if no response
      const errorMessage =
        axiosError.response?.data ||
        axiosError.message ||
        "Unknown error occurred";
      // Handle rate limit errors (429 Too Many Requests)
      if (statusCode === 429 && typeof errorMessage === "string") {
        throw new ApiError(
          429,
          "Too many requests, please try again after sometime"
        );
      }
      // Handle other Axios errors with status
      throw new ApiError(
        statusCode,
        `Failed to check pathao fraud status. ${errorMessage}`
      );
    }
    // Handle non-Axios errors
    throw new ApiError(
      500,
      "Failed to check pathao fraud status due to an unexpected error."
    );
  }
};

export { pathaoFraudCheck };
