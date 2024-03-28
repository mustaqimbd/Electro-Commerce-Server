"use strict";
import { Request } from "express";
import * as bizSdk from "facebook-nodejs-business-sdk";
import config from "../config/config";
import { TOrderSource } from "../modules/orderManagement/order/order.interface";
import { TShippingData } from "../modules/orderManagement/shipping/shipping.interface";
import { CApiHash } from "../utilities/CApiHash";
import { errorLogger } from "../utilities/logger";

export const pixelEventHandler = (
  eventName: "Purchase" | "AddToCart" | "InitiateCheckout",
  usesDataInput: { phone: string; email?: string },
  productInfo: { productId: string; quantity: number },
  customDataInput: { value: number },
  sourceUrl: string,
  actionSource: "App" | "Website",
  req: Request,
  eventId: string
) => {
  const Content = bizSdk.Content;
  const CustomData = bizSdk.CustomData;
  const DeliveryCategory = bizSdk.DeliveryCategory;
  const EventRequest = bizSdk.EventRequest;
  const UserData = bizSdk.UserData;
  const ServerEvent = bizSdk.ServerEvent;

  const access_token = `${config.c_api_access_token}`;
  const pixel_id = `${config.pixel_id}`;
  bizSdk.FacebookAdsApi.init(access_token);

  const current_timestamp = Math.floor(
    (new Date() as unknown as number) / 1000
  );

  const userData = new UserData()
    .setEmails([...(usesDataInput.email as string)])
    .setPhone(CApiHash(usesDataInput.phone))
    .setClientIpAddress(req.clientIp as string)
    .setClientUserAgent(req?.headers!["user-agent"] as string)
    .setFbp(req?.cookies?._fbp)
    .setFbc(req?.cookies?._fbc);

  const content = new Content()
    .setId(productInfo.productId)
    .setQuantity(productInfo.quantity)
    .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY);

  const customData = new CustomData()
    .setContents([content])
    .setCurrency("bdt")
    .setValue(customDataInput.value);

  const serverEvent = new ServerEvent()
    .setEventName(eventName)
    .setEventTime(current_timestamp)
    .setUserData(userData)
    .setCustomData(customData)
    .setEventSourceUrl(sourceUrl)
    .setActionSource(actionSource)
    .setEventId(eventId);

  const eventsData = [serverEvent];
  const eventRequest = new EventRequest(access_token, pixel_id).setEvents(
    eventsData
  );
  eventRequest.execute().then(
    () => {},
    (err) => {
      errorLogger.error("Failed to track on facebook pixel.", err);
    }
  );
};

export const purchaseEventHelper = (
  shipping: TShippingData,
  orderInfo: { productId: string; quantity: number; totalCost: number },
  orderSource: TOrderSource,
  req: Request,
  eventId: string
) => {
  if (config.c_api_access_token && config.pixel_id) {
    pixelEventHandler(
      "Purchase",
      { phone: shipping.phoneNumber, email: "" },
      { productId: orderInfo.productId, quantity: orderInfo.quantity },
      { value: orderInfo.totalCost },
      `${orderSource.url}`,
      `${orderSource.name === "App" ? "App" : "Website"}`,
      req,
      eventId
    );
  }
};
