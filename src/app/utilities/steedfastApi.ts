import { TCourierCredentials } from "../modules/courier/courier.interface";

const steedFastApi = async (config: {
  credentials: TCourierCredentials[];
  endpoints: string;
  payload?: Record<string, string>[];
  method: "GET" | "POST";
}) => {
  const { credentials, endpoints, payload, method } = config;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const url = `https://portal.steadfast.com.bd/api/v1${endpoints}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(credentials || []),
  };
  const reqConfig: Record<string, unknown> = { method, headers };
  if (payload) {
    reqConfig.body = JSON.stringify(payload);
  }
  // const res = await fetch(url, reqConfig);
  // if (res.ok) {
  //   return await res.json();
  // } else {
  //   throw new Error(res.statusText);
  // }
  const data = {
    data: [
      {
        invoice: "2431634429",

        recipient_name: "John Doe",

        recipient_address: "House 44, Road 2/A, Dhanmondi, Dhaka 1209",

        recipient_phone: "0171111111",

        cod_amount: "0.00",

        note: null,

        consignment_id: 11543968,

        tracking_code: "B025A038",

        status: "success",
      },

      {
        invoice: "230822-1",

        recipient_name: "John Doe",

        recipient_address: "House 44, Road 2/A, Dhanmondi, Dhaka 1209",

        recipient_phone: "0171111111",

        cod_amount: "0.00",

        note: null,

        consignment_id: 11543969,

        tracking_code: "B025A1DC",

        status: "success",
      },

      {
        invoice: "230822-1",

        recipient_name: "John Doe",

        recipient_address: "House 44, Road 2/A, Dhanmondi, Dhaka 1209",

        recipient_phone: "0171111111",

        cod_amount: "0.00",

        note: null,

        consignment_id: 11543970,

        tracking_code: "B025A23A",

        status: "success",
      },

      {
        invoice: "230822-1",

        recipient_name: "John Doe",

        recipient_address: "House 44, Road 2/A, Dhanmondi, Dhaka 1209",

        recipient_phone: "0171111111",

        cod_amount: "0.00",

        note: null,

        consignment_id: 11543971,

        tracking_code: "B025A3FA",

        status: "success",
      },
    ],
  };
  return data;
};

export default steedFastApi;
