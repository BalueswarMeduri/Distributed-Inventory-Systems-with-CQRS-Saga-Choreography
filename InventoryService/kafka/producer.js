import { producer } from "./client.js";
import dotenv from "dotenv";

dotenv.config();

const TOPIC_INVENTORY_EVENTS = process.env.KAFKA_TOPIC_INVENTORY_EVENTS || "inventory-events";
const TOPIC_INVENTORY_DB_UPDATE = process.env.KAFKA_TOPIC_INVENTORY_DB_UPDATE || "inventory-DBupdate-events";

let isConnected = false;

export const connectProducer = async () => {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    console.log("Inventory Kafka Producer connected successfully.");
  } catch (error) {
    console.error("Failed to connect Inventory Kafka Producer:", error.message);
  }
};

export const disconnectProducer = async () => {
  if (!isConnected) return;
  try {
    await producer.disconnect();
    isConnected = false;
    console.log("Inventory Kafka Producer disconnected.");
  } catch (error) {
    console.error("Error disconnecting Inventory Kafka Producer:", error.message);
  }
};

/**
 * Publish an inventory event to 'inventory-events' topic (Saga with Order Service).
 * @param {'InventoryReserved' | 'InventoryReservationFailed'} eventType
 * @param {Object} eventData
 */
export const publishInventoryEvent = async (eventType, eventData) => {
  try {
    if (!isConnected) {
      await connectProducer();
    }

    const payload = {
      eventType,
      data: {
        orderId: eventData.orderId,
        productId: eventData.productId,
        quantity: eventData.quantity,
        status: eventType === "InventoryReserved" ? "RESERVED" : "FAILED",
        reason: eventData.reason || null,
        remainingStock: eventData.remainingStock,
        timestamp: new Date().toISOString(),
      },
    };

    const record = {
      topic: TOPIC_INVENTORY_EVENTS,
      messages: [
        {
          key: String(eventData.orderId),
          value: JSON.stringify(payload),
        },
      ],
    };

    await producer.send(record);
    console.log(
      `[Kafka Saga Event Published] Topic: ${TOPIC_INVENTORY_EVENTS} | Type: ${eventType} | OrderId: ${eventData.orderId}`
    );
  } catch (error) {
    console.error(`Failed to publish ${eventType} event:`, error.message);
    throw error;
  }
};

/**
 * Publish a database write update event to 'inventory-DBupdate-events' topic (CQRS sync to MongoDB).
 * @param {'ProductCreated' | 'ProductUpdated' | 'ProductDeleted'} eventType
 * @param {Object} productData
 */
export const publishDbUpdateEvent = async (eventType, productData) => {
  try {
    if (!isConnected) {
      await connectProducer();
    }

    const productId = productData.product_id || productData.productId;

    const payload = {
      eventType,
      data: {
        productId,
        name: productData.name,
        stock: productData.stock !== undefined ? Number(productData.stock) : 0,
        price: productData.price !== undefined ? Number(productData.price) : 0.0,
        timestamp: new Date().toISOString(),
      },
    };

    const record = {
      topic: TOPIC_INVENTORY_DB_UPDATE,
      messages: [
        {
          key: String(productId),
          value: JSON.stringify(payload),
        },
      ],
    };

    await producer.send(record);
    console.log(
      `[Kafka CQRS Event Published] Topic: ${TOPIC_INVENTORY_DB_UPDATE} | Type: ${eventType} | Product: ${productId}`
    );
  } catch (error) {
    console.error(`Failed to publish ${eventType} DB update event:`, error.message);
    throw error;
  }
};
