import moment from "moment-timezone";
import { TPeriod } from "../modules/reports/reports.interface";

export const getTimePeriod = (param: {
  period: TPeriod;
  customDate?: string;
  startDate?: string;
  endDate?: string;
  zone?: string;
}) => {
  const { period, customDate, startDate, endDate, zone } = param;
  const timeZone = zone || "Asia/Dhaka";
  let start, end;

  switch (period) {
    case "today":
      start = moment.tz(timeZone).startOf("day").toDate();
      end = moment.tz(timeZone).endOf("day").toDate();
      break;

    case "yesterday":
      start = moment.tz(timeZone).subtract(1, "day").startOf("day").toDate();
      end = moment.tz(timeZone).subtract(1, "day").endOf("day").toDate();
      break;

    case "thisWeek":
      start = moment.tz(timeZone).startOf("week").toDate();
      end = moment.tz(timeZone).endOf("week").toDate();
      break;

    case "lastWeek":
      start = moment.tz(timeZone).subtract(1, "week").startOf("week").toDate();
      end = moment.tz(timeZone).subtract(1, "week").endOf("week").toDate();
      break;

    case "thisMonth":
      start = moment.tz(timeZone).startOf("month").toDate();
      end = moment.tz(timeZone).endOf("month").toDate();
      break;

    case "lastMonth":
      start = moment
        .tz(timeZone)
        .subtract(1, "month")
        .startOf("month")
        .toDate();
      end = moment.tz(timeZone).subtract(1, "month").endOf("month").toDate();
      break;

    case "thisYear":
      start = moment.tz(timeZone).startOf("year").toDate();
      end = moment.tz(timeZone).endOf("year").toDate();
      break;

    case "lastYear":
      start = moment.tz(timeZone).subtract(1, "year").startOf("year").toDate();
      end = moment.tz(timeZone).subtract(1, "year").endOf("year").toDate();
      break;

    case "customDate":
      if (!customDate) {
        throw new Error(
          "customDate parameter is required for customDate period"
        );
      }
      start = moment.tz(customDate, timeZone).startOf("day").toDate();
      end = moment.tz(customDate, timeZone).endOf("day").toDate();
      break;

    case "customRange":
      if (!startDate || !endDate) {
        throw new Error(
          "startDate and endDate parameters are required for customRange period"
        );
      }
      start = moment.tz(startDate, timeZone).startOf("day").toDate();
      end = moment.tz(endDate, timeZone).endOf("day").toDate();
      break;

    case "yearly":
      start = moment.tz(timeZone).startOf("year").toDate();
      end = moment.tz(timeZone).endOf("year").toDate();
      break;

    default:
      throw new Error("Invalid period specified");
  }

  return { start, end };
};
