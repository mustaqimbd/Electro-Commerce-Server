import { Courier } from "./fraudCheck.interface";
import { paperFlyFraudCheck } from "./paperFlyFraudCheck";

function formatValue(value: number) {
  return value % 1 === 0 ? value : Math.round(value); // 84.33=84 84.55=85
  // return value % 1 === 0 ? value : parseFloat(value.toFixed(2)); // 84.3333=84.33 84.5456=84.55
}

const formatPaperFlyFraudData = async (mobile: string) => {
  try {
    const res = await paperFlyFraudCheck(mobile);

    const paperFly = res.records?.length
      ? {
          records: res.records.map(
            ({ delivered, returned }: Record<string, string>) => ({
              delivered: parseInt(delivered) || 0,
              returned: parseInt(returned) || 0,
            })
          ),
        }
      : { records: [{ delivered: 0, returned: 0 }] };

    const totalOrders: number =
      (paperFly.records?.[0]?.delivered || 0) +
      (paperFly.records?.[0]?.returned || 0);

    const totalDeliveries: number = paperFly?.records?.[0]?.delivered || 0;

    const totalCancellations = totalOrders - totalDeliveries;

    const successRatio = (totalDeliveries / totalOrders) * 100 || 0;

    const couriers: Courier[] = [
      {
        name: "PaperFly",
        logo: "https://go.paperfly.com.bd/static/assets/paperfly-logo.d67bc8c5.png",
        orders: totalOrders,
        deliveries: totalDeliveries,
        cancellations: totalCancellations,
        deliveryRate: formatValue(successRatio),
      },
    ];

    type Data = {
      totalOrders: number;
      totalDeliveries: number;
      totalCancellations: number;
      couriers: Courier[];
      error?: boolean;
      errorFrom?: string;
      message?: string;
    };
    const data: Data = {
      totalOrders,
      totalDeliveries,
      totalCancellations,
      couriers,
    };

    return data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      error: true,
      errorFrom: "PaperFly",
      message: error.message,
      totalOrders: 0,
      totalDeliveries: 0,
      totalCancellations: 0,
      couriers: [],
    };
  }
};

export { formatPaperFlyFraudData, formatValue };
