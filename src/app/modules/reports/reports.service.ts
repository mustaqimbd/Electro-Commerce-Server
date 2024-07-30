import { PipelineStage } from "mongoose";
import { Order } from "../orderManagement/order/order.model";

import {
  orderSources,
  orderStatus,
} from "../orderManagement/order/order.const";
import { OrderStatusHistory } from "../orderManagement/orderStatusHistory/orderStatusHistory.model";
import { ReportsHelper } from "./reports.helper";
import { TReportsQuery } from "./reports.interface";

const getOrdersCountsFromDB = async (query: TReportsQuery) => {
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
  } else if (query.type === "yearly") {
    // This is the case for yearly reports by every year
    const startOfYear = new Date(dateNow.getFullYear(), 0, 1);
    const endOfYear = new Date(dateNow.getFullYear() + 1, 0, 1);

    matchQuery.createdAt = {
      $gte: startOfYear,
      $lt: endOfYear,
    };

    pipeline.push(...ReportsHelper.yearlyOrdersPipeline(matchQuery));
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

const getOrderCountsByStatusFromDB = async () => {
  orderStatus.pop();
  const statusMap: { [key: string]: number } = { all: 0 };
  orderStatus.forEach((item: string) => {
    statusMap[item] = 0;
  });

  const statusPipeline = [
    {
      $match: {
        status: {
          $in: Object.keys(statusMap),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ];

  const result = await Order.aggregate(statusPipeline);

  result.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
    statusMap.all += total;
  });

  const formattedResult = Object.entries(statusMap).map(([name, total]) => {
    const percentage =
      name === "all" ? undefined : (total / statusMap.all) * 100;
    return {
      name,
      total,
      percentage: percentage ? parseFloat(percentage.toFixed(2)) : undefined,
    };
  });

  return formattedResult;
};

const getSourceCountsFromDB = async () => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: { $ne: "deleted" },
      },
    },
    {
      $facet: {
        totalOrders: [
          {
            $count: "total",
          },
        ],
        orderCounts: [
          {
            $group: {
              _id: "$orderSource.name",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $unwind: "$totalOrders",
    },
    {
      $unwind: "$orderCounts",
    },
    {
      $project: {
        source: "$orderCounts._id",
        count: "$orderCounts.count",
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ["$orderCounts.count", "$totalOrders.total"] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $addFields: {
        order: { $indexOfArray: [orderSources, "$source"] },
      },
    },
    {
      $sort: { order: 1 },
    },
    {
      $project: {
        order: 0,
      },
    },
  ];

  const results = await Order.aggregate(pipeline);

  const resultMap = results.reduce((map, item) => {
    map[item.source] = item;
    return map;
  }, {});

  const completeList = orderSources.map((source) => ({
    source,
    count: resultMap[source]?.count || 0,
    percentage: resultMap[source]?.percentage || 0,
  }));

  return completeList;
};

const getOrderStatusChangeCountsFromDB = async (dateParam: string) => {
  const date = dateParam ? new Date(dateParam) : new Date();
  const formattedDate = date.toISOString().split("T")[0];
  const pipeline: PipelineStage[] = [
    { $unwind: "$history" },
    {
      $match: {
        "history.createdAt": {
          $gte: new Date(`${formattedDate}T00:00:00.000Z`),
          $lt: new Date(`${formattedDate}T23:59:59.999Z`),
        },
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$history.createdAt" },
          },
          status: "$history.status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id.date",
        status: "$_id.status",
        count: 1,
      },
    },
    {
      $addFields: {
        order: { $indexOfArray: [orderStatus, "$status"] },
      },
    },
    { $sort: { date: 1, order: 1 } },
  ];

  const result = await OrderStatusHistory.aggregate(pipeline);

  const statusCountMap = result.reduce((map, item) => {
    map[item.status] = item.count;
    return map;
  }, {});

  const completeStatusList = orderStatus.map((status) => ({
    date: formattedDate,
    status: status,
    count: statusCountMap[status] || 0,
  }));

  return completeStatusList;
};

getOrderStatusChangeCountsFromDB("2024-03-14");

export const ReportsServices = {
  getOrdersCountsFromDB,
  getOrderCountsByStatusFromDB,
  getSourceCountsFromDB,
  getOrderStatusChangeCountsFromDB,
};
