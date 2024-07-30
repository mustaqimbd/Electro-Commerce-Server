import { PipelineStage } from "mongoose";

const hourlyOrdersPipeline = (
  matchQuery: Record<string, unknown>
): PipelineStage[] => [
  {
    $match: matchQuery,
  },
  {
    $addFields: {
      createdAtBDT: {
        $dateAdd: {
          startDate: "$createdAt",
          unit: "hour",
          amount: 6,
        },
      },
    },
  },
  {
    $group: {
      _id: {
        hour: { $hour: "$createdAtBDT" },
      },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      id: "$_id.hour",
      name: "hour",
      count: 1,
    },
  },
  {
    $sort: { "_id.hour": 1 },
  },
];

const dailyOrdersPipeline = (
  matchQuery: Record<string, unknown>
): PipelineStage[] => [
  {
    $match: matchQuery,
  },
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
        },
      },
      name: "day",
      count: 1,
    },
  },
  {
    $sort: { id: 1 },
  },
];

const monthlyOrdersPipeline = (
  matchQuery: Record<string, unknown>
): PipelineStage[] => [
  {
    $match: matchQuery,
  },
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      id: {
        $dateToString: {
          format: "%Y-%m",
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
            },
          },
        },
      },
      name: "month",
      count: 1,
    },
  },
  {
    $sort: { id: 1 },
  },
];

const yearlyOrdersPipeline = (
  matchQuery: Record<string, unknown>
): PipelineStage[] => [
  {
    $match: matchQuery,
  },
  {
    $addFields: {
      year: { $year: "$createdAt" },
    },
  },
  {
    $group: {
      _id: "$year",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      id: "$_id",
      name: "year",
      count: 1,
    },
  },
  {
    $sort: { id: 1 },
  },
];

export const ReportsHelper = {
  hourlyOrdersPipeline,
  dailyOrdersPipeline,
  monthlyOrdersPipeline,
  yearlyOrdersPipeline,
};
