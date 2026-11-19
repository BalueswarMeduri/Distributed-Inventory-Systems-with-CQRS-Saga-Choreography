import { producer } from "./client.js";
import dotenv from "dotenv";

dotenv.config();

const TOPIC_ORDER_EVENTS = process.env.KAFKA_TOPIC_ORDER_EVENTS || "order-events";

let isConnected = false;

// Connect Kafka Producer
export const connectProducer = async () => {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    console.log("Kafka Producer connected successfully.");
  } catch (error) {
    console.error("Failed to connect Kafka Producer:", error.message);
  }
};

// Disconnect Kafka Producer
export const disconnectProducer = async () => {
  if (!isConnected) return;
  try {
    await producer.disconnect();
    isConnected = false;
    console.log("Kafka Producer disconnected.");
  } catch (error) {
    console.error("Error disconnecting Kafka Producer:", error.message);
  }
};

/**
 * Publish an order event to the 'order-events' topic.
 * @param {'OrderCreated' | 'OrderCancelled'} eventType
 * @param {Object} orderData
 */
export const publishOrderEvent = async (eventType, orderData) => {
  try {
    if (!isConnected) {
      await connectProducer();
    }

    const payload = {
      eventType,
      data: {
        orderId: orderData.id,
        userId: orderData.user_id,
        productId: orderData.product_id,
        quantity: orderData.quantity,
        price: orderData.price,
        status: orderData.status,
        timestamp: new Date().toISOString(),
      },
    };

    const record = {
      topic: TOPIC_ORDER_EVENTS,
      messages: [
        {
          key: String(orderData.id),
          value: JSON.stringify(payload),
        },
      ],
    };

    const result = await producer.send(record);
    console.log(`[Kafka Event Published] Topic: ${TOPIC_ORDER_EVENTS} | Type: ${eventType} | OrderId: ${orderData.id}`);
    return result;
  } catch (error) {
    console.error(`Failed to publish ${eventType} event to Kafka:`, error.message);
    throw error;
  }
};
