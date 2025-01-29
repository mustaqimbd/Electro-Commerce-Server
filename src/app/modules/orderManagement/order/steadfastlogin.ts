// import axios from "axios";
// import { CookieJar } from "tough-cookie";
// import * as cheerio from 'cheerio';// For more robust HTML parsing

// // Create a new cookie jar instance
// const cookieJar = new CookieJar();

// Create an Axios instance with the cookie jar and session
// const session = axios.create({
//   baseURL: "https://steadfast.com.bd",
//   withCredentials: true, // Ensures cookies are preserved
//   headers: {
//     "User-Agent":
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
//   },
//   // Attach cookie jar to the Axios instance
//   jar: cookieJar,
// });

async function login() {
  //   try {
  //     // Step 1: Get the login page
  //     const response = await session.get("/login");
  //     const html = response.data;
  //     // Use Cheerio to parse the HTML and extract CSRF token
  //     const $ = cheerio.load(html);
  //     const csrfToken = $('input[name="_token"]').val();
  //     if (!csrfToken) {
  //       console.error("CSRF token not found");
  //       return;
  //     }
  //     console.log("CSRF Token:", csrfToken);
  //     // Step 2: Submit the login form with the CSRF token, email, and password
  //     const loginData = {
  //       _token: csrfToken,
  //       email: "mustaqimbd@gmail.com", // Replace with your email
  //       password: "2837494873", // Replace with your password
  //     };
  //  // The cookies received from the server will be automatically managed by `cookieJar`
  //     const cookies = await cookieJar.getCookies("https://steadfast.com.bd");
  //     console.log("Cookies after login:", cookies);
  //      // You can also check if specific cookies are set
  //      const xsrfToken = cookies.find((cookie) => cookie.key === "XSRF-TOKEN");
  //      if (xsrfToken) {
  //        console.log("XSRF-TOKEN cookie:", xsrfToken);
  //      } else {
  //        console.log("XSRF-TOKEN cookie not found");
  //      }
  //     // Step 3: Send login request with the CSRF token
  //     const loginResponse = await session.post("/login", loginData);
  //     console.log("Login Response:", loginResponse.data);
  //   } catch (error) {
  //     console.error("An error occurred:", error);
  //   }
}

// Call the login function
export default login;

// import axios from "axios";

// // Create an Axios instance with a session
// const session = axios.create({
//   baseURL: "https://steadfast.com.bd",
//   withCredentials: true, // Ensures cookies are preserved
//   headers: {
//     "User-Agent":
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
//   },
// });

// async function login() {
//   try {
//     // Step 1: Get the login page
//     const response = await session.get("/login");
//     // const response = await session.get("/user/frauds/check/01789699367");

//     const html = response.data;

//     // console.log(html);  // Log the HTML response for debugging

//     // Step 2: Use regex to extract the CSRF token
//     const csrfTokenMatch = html.match(/name="_token" value="([^"]+)"/);

//     if (!csrfTokenMatch) {
//       console.error("CSRF token not found");
//       return;
//     }

//     const csrfToken = csrfTokenMatch[1]; // Extracted CSRF token

//     console.log("CSRF Token:", csrfToken);

//     // Step 3: Submit the login form with the CSRF token, email, and password
//     const loginData = {
//       _token: csrfToken,
//       email: "mustaqimbd@gmail.com", // Replace with your email
//       password: "2837494873", // Replace with your password
//     };

//     // const loginResponse = await session.post("/login", loginData);
//     const loginResponse = await session.post("/login", loginData);

//     console.log("Login Response:", loginResponse.data);
//   } catch (error) {
//     console.error("An error occurred:", error);
//   }
// }

// // Call the login function
// export default login;
