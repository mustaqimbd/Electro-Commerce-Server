import axios from "axios";
import config from "../../config/config";
import { TConversationAPIEvents } from "../../types/ConversationAPI";
import { logger } from "../logger";

type TConversationAPIParams = {
  eventName: TConversationAPIEvents;
  userData: {
    ip: string;
    userAgent: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    value?: number;
  };
  eventId: string;
};

export const ConversationAPI = async (payload: TConversationAPIParams) => {
  const { eventName, userData, eventId, custom_data } = payload;
  const access_token = config.c_api_access_token;
  const pixel_id = config.pixel_id;

  if (access_token === undefined || pixel_id === undefined) {
    return;
  }

  try {
    const url = `https://graph.facebook.com/v16.0/${pixel_id}/events?test_event_code=TEST123`;

    const eventData = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          user_data: {
            client_ip_address: userData.ip,
            client_user_agent: userData.userAgent,
            fbc: userData?.fbc,
            fbp: userData?.fbp,
          },
          custom_data: {
            value: custom_data?.value,
            currency: "BDT",
          },
          opt_out: false,
        },
      ],
      access_token,
    };

    await axios.post(url, eventData);
  } catch (error) {
    logger.error("CAPI event failed", error);
  }
};

// const ab = {
//   data: [
//     {
//       event_name: "Purchase",
//       event_time: 1633552688,
//       event_id: "event.id.123",
//       event_source_url: "http://jaspers-market.com/product/123",
//       action_source: "website",
//       user_data: {
//         client_ip_address: "192.19.9.9",
//         client_user_agent: "test ua",
//         em: [
//           "309a0a5c3e211326ae75ca18196d301a9bdbd1a882a4d2569511033da23f0abd",
//         ],
//         ph: [
//           "254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4",
//           "6f4fcb9deaeadc8f9746ae76d97ce1239e98b404efe5da3ee0b7149740f89ad6",
//         ],
//         fbc: "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
//         fbp: "fb.1.1558571054389.1098115397",
//       },
//       custom_data: {
//         value: 100.2,
//         currency: "USD",
//         content_ids: ["product.id.123"],
//         content_type: "product",
//       },
//       opt_out: false,
//     },
//   ],
// };
