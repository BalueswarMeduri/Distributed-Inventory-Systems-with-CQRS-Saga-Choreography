import * as OrderModel from "../models/orderModel.js";
import { publishOrderEvent } from "../kafka/producer.js";

// Helper to format tracking message
const getTrackingStatusInfo = (status) => {
  switch (status) {
    case "PENDING":
      return {
        step: 1,
        message: "Order placed. Awaiting stock reservation from Inventory Service.",
      };
    case "CONFIRMED":
      return {
        step: 2,
        message: "Stock confirmed. Order is ready and active.",
      };
    case "CANCELLED":
      return {
        step: 3,
        message: "Order has been cancelled.",
      };
    case "FAILED":
      return {
        step: 3,
        message: "Order failed due to insufficient inventory.",
      };
    default:
      return {
        step: 0,
        message: `Current status: ${status}`,
      };
  }
};

// 1. Create a new Order
export const createOrder = async (req, res) => {
  try {
    const { productId, quantity, price, userId } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({ success: false, error: "productId is required." });
    }

    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, error: "quantity must be a number greater than 0." });
    }

    // Default userId = 1 for learning project
    const assignedUserId = userId || 1;
    const finalPrice = price !== undefined && !isNaN(price) ? Number(price) : 0;

    const order = await OrderModel.createOrder({
      userId: assignedUserId,
      productId: String(productId),
      quantity: Number(quantity),
      price: finalPrice,
    });

    // Publish OrderCreated event to Kafka (topic: order-events)
    try {
      await publishOrderEvent("OrderCreated", order);
    } catch (kafkaErr) {
      console.error("Warning: Failed to publish OrderCreated event:", kafkaErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully (Status: PENDING).",
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ success: false, error: "Internal server error creating order." });
  }
};

// 2. Track Order / Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, error: `Order with ID ${id} not found.` });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ success: false, error: "Internal server error fetching order." });
  }
};

// 3. Track Order Status
export const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, error: `Order with ID ${id} not found.` });
    }

    const tracking = getTrackingStatusInfo(order.status);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      userId: order.user_id,
      productId: order.product_id,
      quantity: order.quantity,
      status: order.status,
      trackingInfo: tracking,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    });
  } catch (error) {
    console.error("Error tracking order:", error);
    return res.status(500).json({ success: false, error: "Internal server error tracking order." });
  }
};

// 4. Get All Orders (Default for userId = 1)
export const getAllOrders = async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const orders = await OrderModel.getAllOrders(userId);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ success: false, error: "Internal server error fetching orders." });
  }
};

// 5. Update Order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;

    const existing = await OrderModel.getOrderById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Order with ID ${id} not found.` });
    }

    if (existing.status === "CANCELLED" || existing.status === "FAILED") {
      return res.status(400).json({
        success: false,
        error: `Cannot update order in '${existing.status}' status.`,
      });
    }

    const updated = await OrderModel.updateOrder(id, { quantity, price });

    return res.status(200).json({
      success: true,
      message: "Order updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ success: false, error: "Internal server error updating order." });
  }
};

// 6. Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await OrderModel.getOrderById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Order with ID ${id} not found.` });
    }

    if (existing.status === "CANCELLED") {
      return res.status(200).json({
        success: true,
        message: "Order is already cancelled.",
        data: existing,
      });
    }

    const cancelledOrder = await OrderModel.cancelOrder(id);

    // Publish OrderCancelled event to Kafka (topic: order-events)
    try {
      await publishOrderEvent("OrderCancelled", cancelledOrder);
    } catch (kafkaErr) {
      console.error("Warning: Failed to publish OrderCancelled event:", kafkaErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: cancelledOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ success: false, error: "Internal server error cancelling order." });
  }
};
