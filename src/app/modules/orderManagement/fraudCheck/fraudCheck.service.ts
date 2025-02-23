import { Courier, Errors, Report } from "./fraudCheck.interface";
import {
  formatPaperFlyFraudData,
  formatPathaoFraudData,
  formatRedXFraudData,
  formatSteadfastFraudData,
  formatValue,
} from "./fraudCheck.utils";

const fraudCheckDB = async (mobile: string) => {
  // Fetch all data concurrently
  const [steadFast, pathao, redX, paperFly] = await Promise.all([
    formatSteadfastFraudData(mobile),
    formatPathaoFraudData(mobile),
    formatRedXFraudData(mobile),
    formatPaperFlyFraudData(mobile),
  ]);

  const errors: Errors[] = [];
  const reports: Report[] = [];

  // Helper to add reports and errors from each source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addData = (source: any) => {
    if (source.reports) reports.push(...source.reports);
    if (source.error) {
      errors.push({
        errorFrom: source.errorFrom,
        message: source.message,
      });
    }
  };

  // Process all sources
  [steadFast, pathao, redX, paperFly].forEach(addData);

  // Calculate total orders and deliveries correctly across all sources
  const totalOrders =
    steadFast.totalOrders +
    pathao.totalOrders +
    redX.totalOrders +
    paperFly.totalOrders;

  const totalDeliveries =
    steadFast.totalDeliveries +
    pathao.totalDeliveries +
    redX.totalDeliveries +
    paperFly.totalDeliveries;

  const totalCancellations = totalOrders - totalDeliveries;
  const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

  const couriers: Courier[] = [
    ...steadFast.couriers,
    ...pathao.couriers,
    ...redX.couriers,
    ...paperFly.couriers,
  ];

  const message =
    successRatio >= 70
      ? "ভালো কাস্টমার! ক্যাশ অন ডেলিভারিতে পার্সেল পাঠানো যাবে।"
      : successRatio >= 40
        ? "ব্যবহার ও আচরণের উপর নির্ভর করে পার্সেল পাঠানো যাবে, অগ্রিম ডেলিভারি চার্জ নিলে ভালো হয়।"
        : "সাবধান! পার্সেল পাঠানোর আগে ডেলিভারি চার্জ নিয়ে নিবেন।";

  return {
    phoneNumber: mobile,
    totalOrders,
    totalDeliveries,
    totalCancellations,
    successRatio: formatValue(successRatio),
    message,
    couriers,
    reports,
    errors,
  };
};

export const FraudCheckServices = {
  fraudCheckDB,
};
