import { PipelineStage } from "mongoose";
import config from "../../config/config";
import { getTimePeriod } from "../../utilities/getTimePeriod";
import {
  orderSources,
  orderStatus,
} from "../orderManagement/order/order.const";
import { Order } from "../orderManagement/order/order.model";
import { OrderStatusHistory } from "../orderManagement/orderStatusHistory/orderStatusHistory.model";
import { ReportsHelper } from "./reports.helper";
import { TReportsQuery } from "./reports.interface";

export type TOrdersCountQuery = TReportsQuery & { zone: string };
const getOrdersCountsFromDB = async (query: TOrdersCountQuery) => {
  const pipeline: PipelineStage[] = [];
  query.type = query.type || "today";
  const { start, end } = getTimePeriod({
    period: query.type,
    customDate: query.customDate,
    startDate: query.startDate,
    endDate: query.endDate,
    zone: query.zone,
  });

  const matchQuery = {
    status: { $ne: "deleted" },
    createdAt: {
      $gte: start,
      $lt: end,
    },
  };

  if (query.type === "yesterday" || query.type === "customDate") {
    pipeline.push(...ReportsHelper.hourlyOrdersPipeline(matchQuery));
  } else if (
    ["thisWeek", "lastWeek", "thisMonth", "lastMonth", "customRange"].includes(
      query.type
    )
  ) {
    pipeline.push(...ReportsHelper.dailyOrdersPipeline(matchQuery));
  } else if (["thisYear", "lastYear"].includes(query.type)) {
    pipeline.push(...ReportsHelper.monthlyOrdersPipeline(matchQuery));
  } else if (["yearly"].includes(query.type)) {
    pipeline.push(...ReportsHelper.yearlyOrdersPipeline(matchQuery));
  } else {
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

const getBestSellingProductsFromDB = async () => {
  const pipeline: PipelineStage[] = [
    {
      $match: { status: { $ne: "deleted" } },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $group: {
        _id: "$productDetails.product",
        totalQuantity: { $sum: "$productDetails.quantity" },
        totalWarrantyClaims: {
          $sum: {
            $cond: [{ $eq: ["$productDetails.isWarrantyClaim", true] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "images",
        localField: "product.image.thumbnail",
        foreignField: "_id",
        as: "productImage",
      },
    },
    {
      $unwind: "$productImage",
    },
    {
      $lookup: {
        from: "inventories",
        localField: "product.inventory",
        foreignField: "_id",
        as: "inventory",
      },
    },
    {
      $unwind: "$inventory",
    },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        productName: "$product.title",
        productImage: {
          $concat: [config.image_server, "/", "$productImage.src"],
        },
        stockQuantity: "$inventory.stockQuantity",
        totalSales: "$totalQuantity",
        totalWarrantyClaims: "$totalWarrantyClaims",
      },
    },
  ];
  const result = await Order.aggregate(pipeline);

  return result;
};

const getStatsFromDB = async () => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        status: { $in: ["completed", "partly completed"] },
      },
    },
    {
      $facet: {
        totalSalesAmount: [
          {
            $group: {
              _id: null,
              totalSales: {
                $sum: {
                  $add: ["$advance", "$total"],
                },
              },
            },
          },
        ],
        totalDiscount: [
          {
            $group: {
              _id: null,
              totalDiscount: { $sum: "$discount" },
            },
          },
        ],
        totalOrderCount: [
          {
            $count: "totalOrders",
          },
        ],
      },
    },
    {
      $project: {
        totalSalesAmount: { $arrayElemAt: ["$totalSalesAmount.totalSales", 0] },
        totalDiscount: { $arrayElemAt: ["$totalDiscount.totalDiscount", 0] },
        totalOrderCount: { $arrayElemAt: ["$totalOrderCount.totalOrders", 0] },
      },
    },
    {
      $project: {
        results: [
          {
            title: "Sales",
            name: "totalSalesAmount",
            count: "$totalSalesAmount",
            description: "Total sales",
          },
          {
            title: "Discount",
            name: "totalDiscount",
            count: "$totalDiscount",
            description: "Total discounts",
          },
          {
            title: "Orders",
            name: "totalOrderCount",
            count: "$totalOrderCount",
            description: "Total completed orders",
          },
        ],
      },
    },
    {
      $unwind: "$results",
    },
    {
      $replaceRoot: { newRoot: "$results" },
    },
  ];
  const result = await Order.aggregate(pipeline);
  return result;
};

export const ReportsServices = {
  getOrdersCountsFromDB,
  getOrderCountsByStatusFromDB,
  getSourceCountsFromDB,
  getOrderStatusChangeCountsFromDB,
  getBestSellingProductsFromDB,
  getStatsFromDB,
};
