import {
  Courier,
  Errors,
  FraudCheckData,
  Report,
} from "./fraudCheck.interface";
import { formatPaperFlyFraudData, formatValue } from "./fraudCheck.utils";
import { pathaoFraudCheck } from "./pathaoFraudCheck";
import { redXFraudCheck } from "./redXFraudCheck";
import { steadfastFraudCheck } from "./steadfastFraudCheck";

const fraudCheckDB = async (mobile: string) => {
  const steadFast = await steadfastFraudCheck(mobile);
  const pathao = await pathaoFraudCheck(mobile);
  const redX = await redXFraudCheck(mobile);
  const paperFly = await formatPaperFlyFraudData(mobile);

  const errors: Errors[] = [];
  const reports: Report[] = [];

  if (steadFast[2] && steadFast[2].length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    steadFast[2].forEach((entry: any) => {
      reports.push({
        reportFrom: "Steadfast",
        comment: entry.details,
        date: entry.created_at,
      });
    });
  }

  if (pathao.data?.fraud_reason || pathao.data?.customer?.fraud_reason) {
    reports.push({
      reportFrom: "Pathao",
      comment: pathao.data?.customer?.fraud_reason || pathao.data?.fraud_reason,
      date: "",
      // date: new Date().toISOString().split("T")[0],
    });
  }

  if (paperFly.error) {
    errors.push({
      errorFrom: paperFly.errorFrom,
      message: paperFly.message,
    });
  }

  const totalOrders =
    steadFast[0] +
    steadFast[1] +
    (pathao.data?.customer?.total_delivery || 0) +
    (parseInt(redX.data?.totalParcels, 10) || 0) +
    paperFly.totalOrders;

  const totalDeliveries =
    steadFast[0] +
    (pathao?.data?.customer?.successful_delivery || 0) +
    (parseInt(redX?.data?.deliveredParcels, 10) || 0) +
    paperFly.totalDeliveries;

  const totalCancellations = totalOrders - totalDeliveries;

  const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

  const couriers: Courier[] = [
    {
      name: "Steadfast",
      logo: "https://i.ibb.co.com/tM68nWR/stead-fast.png",
      orders: steadFast[0] + steadFast[1],
      deliveries: steadFast[0],
      cancellations: steadFast[1],
      deliveryRate: formatValue(
        (steadFast[0] / (steadFast[0] + steadFast[1])) * 100 || 0
      ),
    },
    {
      name: "Pathao",
      logo: "https://i.ibb.co.com/b1xNZJY/pathao.png",
      orders: pathao.data?.customer?.total_delivery || 0,
      deliveries: pathao.data?.customer?.successful_delivery || 0,
      cancellations:
        pathao.data?.customer?.total_delivery -
          pathao.data?.customer?.successful_delivery || 0,
      deliveryRate: formatValue(
        (pathao.data?.customer?.successful_delivery /
          pathao.data?.customer?.total_delivery) *
          100 || 0
      ),
    },
    {
      name: "RedX",
      logo: "https://i.ibb.co.com/NWL7Tr4/redx.png",
      orders: parseInt(redX.data?.totalParcels) || 0,
      deliveries: parseInt(redX.data?.deliveredParcels) || 0,
      cancellations:
        parseInt(redX.data?.totalParcels) -
          parseInt(redX.data?.deliveredParcels) || 0,
      deliveryRate: formatValue(
        (parseInt(redX.data?.deliveredParcels) /
          parseInt(redX.data?.totalParcels)) *
          100 || 0
      ),
    },
    ...paperFly.couriers,
  ];

  const message =
    successRatio >= 60
      ? "ভালো কাস্টমার! ক্যাশ অন ডেলিভারিতে পার্সেল পাঠানো যাবে।"
      : successRatio >= 40
        ? "ব্যবহার ও আচরণের উপর নির্ভর করে পার্সেল পাঠানো যাবে, অগ্রিম ডেলিভারি চার্জ নিলে ভালো হয়।"
        : "সাবধান! পার্সেল পাঠানোর আগে ডেলিভারি চার্জ নিয়ে নিবেন।";

  const data: FraudCheckData = {
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

  return data;
};

export const FraudCheckServices = {
  fraudCheckDB,
};
