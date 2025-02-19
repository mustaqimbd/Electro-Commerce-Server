/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import ApiError from "../../../errorHandlers/ApiError";
import config from "../../../config/config";

const API_BASE_URL = "https://api.redx.com.bd";
const REDX_BASE_URL = "https://redx.com.bd";

const cookieJar = new CookieJar();
const session = wrapper(
  axios.create({
    withCredentials: true,
    jar: cookieJar,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    },
  })
);

// ✅ Check if user exists
async function checkUserExists(): Promise<boolean> {
  try {
    const response = await session.get(
      `${API_BASE_URL}/v4/redx/does-user-exist?phoneNumber=${config.redx.phoneNumber}`
    );
    return response.data.exist;
  } catch (error: any) {
    console.error("User does not exist in redX", error);
    throw new ApiError(
      400,
      `User does not exist in redX"). ${error.response?.data || error.message}`
    );
  }
}

// ✅ Login with password and set Authorization token
async function loginWithPassword() {
  try {
    const response = await session.post(`${API_BASE_URL}/v4/auth/login`, {
      phone: config.redx.phoneNumber,
      password: config.redx.password,
    });
    const { data } = response.data;
    const accessToken = data.accessToken;
    session.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    console.log("3. redX login successful");
  } catch (error: any) {
    console.error("RedX login failed:", error);
    throw new ApiError(
      400,
      `RedX login failed. ${error.response?.data || error.message}`
    );
  }
}

// ✅ Corrected isLoggedIn() - Check cookies instead of making an API request
async function isLoggedIn(): Promise<boolean> {
  try {
    const cookies = await cookieJar.getCookies(REDX_BASE_URL);
    return cookies.some((cookie) => cookie.key === "__ti__"); // Ensure session cookie exists
  } catch (error) {
    console.error("Error from redX checking redX login status:", error);
    return false;
  }
}

// ✅ Main function
async function redXFraudCheck(customerPhoneNumber: string) {
  try {
    if (!(await isLoggedIn())) {
      if (!(await checkUserExists())) {
        throw new ApiError(400, "User does not exits in the redX");
      }

      // const { error, body } = await requestLoginCode();
      // if (error) {
      //   console.error("failed to send login code:", body);
      //   return;
      // }
      // const loginCode = "4947"; // Replace with dynamic OTP retrieval
      // await loginWithCode(loginCode);
      // return "Please log in with code for redX";
      await loginWithPassword();
    }

    const response = await session.get(
      `${REDX_BASE_URL}/api/redx_se/admin/parcel/customer-success-return-rate?phoneNumber=88${customerPhoneNumber}`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error checking redX fraud status:", error);
    throw new ApiError(
      400,
      `Failed to check redX fraud status. ${error.response?.data || error.message}`
    );
  }
}

export { redXFraudCheck };

// //✅ Request login code (OTP)
// async function requestLoginCode(): Promise<{
//   error: string;
//   body: Record<string, unknown>;
// }> {
//   const response = await session.post(
//     `${API_BASE_URL}/v1/user/request-login-code`,
//     {
//       countryCode: "BD",
//       callingCode: "+880",
//       phoneNumber: "1804581222",
//       service: "redx",
//     }
//   );

//   return response.data;
// }

// // ✅ Login with OTP and set Authorization token
// async function loginWithCode(loginCode: string) {
//   const response = await session.post(
//     `${API_BASE_URL}/v1/user/login-with-code`,
//     {
//       loginCode,
//       phone: "1804581222",
//     }
//   );

//   const { error, body } = response.data;
//   if (error) {
//     console.error("Error when logging in with code:", body);
//     return;
//   }
//   const accessToken = body.accessToken;
//   session.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
//   return accessToken;
// }
