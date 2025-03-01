import { CronJob } from "cron";
import { Order } from "../modules/orderManagement/order/order.model";
import ApiError from "../errorHandlers/ApiError";

// Cron job to run every day at midnight
new CronJob(
  "0 0 * * *", // Every day at midnight
  async () => {
    try {
      // const oneDayAgo = new Date();
      // oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      await Order.updateMany(
        {
          trackingStatus: { $ne: "not contacted" },
          // updatedAt: { $lte: oneDayAgo },
        },
        { trackingStatus: "not contacted" }
      );
    } catch (error) {
      throw new ApiError(
        500,
        "Error when tracking statuses reset to default (not contacted)."
      );
    }
  },
  null, // No onComplete function needed
  true, // Start the job immediately
  "Asia/Dhaka" // Change this to your desired timezone
);
