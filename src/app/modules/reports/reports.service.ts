import { PipelineStage } from "mongoose";
import { Order } from "../orderManagement/order/order.model";

import { ReportsHelper } from "./reports.helper";
import { TReportsQuery } from "./reports.interface";

const getOrdersFromDB = async (query: TReportsQuery) => {
  const matchQuery: Record<string, unknown> = { status: { $ne: "deleted" } };
  const pipeline: PipelineStage[] = [];
  const dateNow = new Date();

  // Get today's orders count
  if (query.type === "yesterday") {
    const startOfYesterday = new Date(dateNow);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(dateNow);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    matchQuery.createdAt = {
      $gte: startOfYesterday,
      $lt: endOfYesterday,
    };

    pipeline.push(...ReportsHelper.hourlyOrdersPipeline(matchQuery));
  } else if (query.type === "thisWeek") {
    const startOfWeek = new Date(dateNow);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to the start of the week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // End of the week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    matchQuery.createdAt = {
      $gte: startOfWeek,
      $lt: endOfWeek,
    };

    pipeline.push(...ReportsHelper.dailyOrdersPipeline(matchQuery));
  } else if (query.type === "lastWeek") {
    const startOfLastWeek = new Date(dateNow);
    startOfLastWeek.setDate(
      startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
    ); // Start of the previous week
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() + 6); // End of the previous week
    endOfLastWeek.setHours(23, 59, 59, 999);

    matchQuery.createdAt = {
      $gte: startOfLastWeek,
      $lt: endOfLastWeek,
    };

    pipeline.push(...ReportsHelper.dailyOrdersPipeline(matchQuery));
  } else if (query.type === "thisMonth") {
    const startOfMonth = new Date(dateNow.getFullYear(), dateNow.getMonth(), 1);
    const endOfMonth = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    matchQuery.createdAt = {
      $gte: startOfMonth,
      $lt: endOfMonth,
    };

    pipeline.push(...ReportsHelper.dailyOrdersPipeline(matchQuery));
  } else if (query.type === "lastMonth") {
    const startOfLastMonth = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    matchQuery.createdAt = {
      $gte: startOfLastMonth,
      $lt: endOfLastMonth,
    };

    pipeline.push(...ReportsHelper.dailyOrdersPipeline(matchQuery));
  } else if (query.type === "thisYear") {
    const startOfYear = new Date(dateNow.getFullYear(), 0, 1);
    const endOfYear = new Date(dateNow.getFullYear(), 11, 31, 23, 59, 59, 999);

    matchQuery.createdAt = {
      $gte: startOfYear,
      $lt: endOfYear,
    };

    pipeline.push(...ReportsHelper.monthlyOrdersPipeline(matchQuery));
  } else if (query.type === "lastYear") {
    const startOfLastYear = new Date(dateNow.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(
      dateNow.getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999
    );

    matchQuery.createdAt = {
      $gte: startOfLastYear,
      $lt: endOfLastYear,
    };

    pipeline.push(...ReportsHelper.monthlyOrdersPipeline(matchQuery));
  } else if (query.type === "customDate") {
    const customDate = new Date(query.customDate);
    const startOfCustomDate = new Date(customDate);
    startOfCustomDate.setHours(0, 0, 0, 0);

    const endOfCustomDate = new Date(customDate);
    endOfCustomDate.setHours(23, 59, 59, 999);

    matchQuery.createdAt = {
      $gte: startOfCustomDate,
      $lt: endOfCustomDate,
    };

    pipeline.push(...ReportsHelper.hourlyOrdersPipeline(matchQuery));
  } else if (query.type === "customRange") {
    const startOfRange = new Date(query.startDate);
    startOfRange.setHours(0, 0, 0, 0);

    const endOfRange = new Date(query.endDate);
    endOfRange.setHours(23, 59, 59, 999);

    matchQuery.createdAt = {
      $gte: startOfRange,
      $lt: endOfRange,
    };

    pipeline.push(...ReportsHelper.dailyOrdersPipeline(matchQuery));
  } else {
    const startOfDay = new Date(dateNow);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateNow);
    endOfDay.setHours(23, 59, 59, 999);

    matchQuery.createdAt = {
      $gte: startOfDay,
      $lt: endOfDay,
    };
    pipeline.push(...ReportsHelper.hourlyOrdersPipeline(matchQuery));
  }
  const result = await Order.aggregate(pipeline);
  return result;
};

export const ReportsServices = {
  getOrdersFromDB,
};
