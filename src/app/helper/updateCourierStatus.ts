import { Types } from "mongoose";
import { Order } from "../modules/orderManagement/order/order.model";
import { courierStatusUpdateError } from "../utilities/logger";
import steedFastApi from "../utilities/steedfastApi";

const batchSize = 20;

const updateCourierStatus = async () => {
  try {
    const orders = await Order.aggregate([
      {
        $match: {
          status: "On courier",
          deliveryStatus: {
            $in: [
              "pending",
              "delivered_approval_pending",
              "partial_delivered_approval_pending",
              "cancelled_approval_pending",
              "unknown_approval_pending",
              "hold",
              "in_review",
              null,
              undefined,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "couriers",
          localField: "courierDetails.courierProvider",
          foreignField: "_id",
          as: "courier",
        },
      },
      {
        $unwind: "$courier",
      },
      {
        $project: {
          orderId: 1,
          status: 1,
          deliveryStatus: 1,
          courier: {
            name: "$courier.name",
            slug: "$courier.slug",
            credentials: "$courier.credentials",
          },
        },
      },
    ]);

    const updatedData = [];
    // Process orders in batches
    for (let i = 0; i < orders.length; i += batchSize) {
      const batchOrders = orders.slice(i, i + batchSize);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedStatusPromises: any = batchOrders.map(async (order) => {
        try {
          let responseData: Record<string, unknown> = {};

          // for steedfast
          if (order?.courier?.slug === "steedfast") {
            const data = await steedFastApi({
              credentials: order?.courier?.credentials,
              endpoints: `/status_by_invoice/${order.orderId}`,
              method: "GET",
            });
            responseData = {
              _id: order._id,
              orderId: order.orderId,
              delivery_status: data.delivery_status,
            };
          } else {
            throw new Error("No courier found");
          }

          return responseData;
        } catch (error) {
          courierStatusUpdateError.error(
            `One item failed to fetch. Invoice id: ${order.orderId}`,
            error
          );
          return null;
        }
      });

      const updatedStatus = await Promise.all(updatedStatusPromises);

      const successfulUpdates = updatedStatus.filter(
        (status) => status !== null
      );
      updatedData.push(...successfulUpdates);
    }
    const statusUpdateQuery =
      updatedData.map((item) => ({
        updateOne: {
          filter: { _id: item?._id as Types.ObjectId },
          update: {
            status:
              item?.delivery_status === "delivered" ? "completed" : undefined,
            deliveryStatus: item?.delivery_status,
          },
        },
      })) || [];
    if (statusUpdateQuery.length) {
      await Order.bulkWrite(statusUpdateQuery);
    }
  } catch (error) {
    courierStatusUpdateError.error("Failed to update courier status", error);
  }
};

export default updateCourierStatus;
