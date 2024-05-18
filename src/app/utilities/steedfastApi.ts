import { TCourierCredentials } from "../modules/courier/courier.interface";

const steedFastApi = async (config: {
  credentials: TCourierCredentials[];
  endpoints: string;
  payload?: Record<string, string>[];
  method: "GET" | "POST";
}) => {
  const { credentials, endpoints, payload, method } = config;
  const url = `https://portal.steadfast.com.bd/api/v1${endpoints}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(credentials || []),
  };
  const reqConfig: Record<string, unknown> = { method, headers };
  if (payload) {
    reqConfig.body = JSON.stringify(payload);
  }
  try {
    const res = await fetch(url, reqConfig);
    if (res.status === 200) {
      const data = await res.json();
      return data;
    } else {
      throw new Error(res.statusText);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export default steedFastApi;
