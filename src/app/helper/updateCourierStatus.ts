import { Order } from "../modules/orderManagement/order/order.model";
import { courierStatusUpdateError } from "../utilities/logger";

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
            credentials: "$courier.credentials",
          },
        },
      },
    ]);

    // Process orders in batches
    for (let i = 0; i < orders.length; i += batchSize) {
      const batchOrders = orders.slice(i, i + batchSize);

      const updatedStatusPromises = batchOrders.map(async (order) => {
        try {
          let responseData: Record<string, unknown> = {};

          // for steedfast
          if (order?.courier?.name === "steedfast") {
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              ...Object.fromEntries(order?.courier?.credentials || []),
            };
            const url = `https://portal.steadfast.com.bd/api/v1/status_by_invoice/${order.orderId}`;
            const res = await fetch(url, {
              method: "GET",
              headers,
            });
            if (res.status !== 200) {
              throw new Error(res.statusText);
            }
            const data = await res.json();
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
      // Update orders in the database
      const updateOperation = successfulUpdates.map(async (item) => {
        return await Order.updateOne(
          { _id: item?._id },
          { $set: { deliveryStatus: item?.delivery_status } }
        );
      });
      await Promise.all(updateOperation);
    }
  } catch (error) {
    courierStatusUpdateError.error("Failed to update courier status", error);
  }
};

export default updateCourierStatus;
