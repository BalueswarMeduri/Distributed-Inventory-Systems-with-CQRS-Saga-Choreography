import { kafka } from "./client.js";
import { reserveStock, releaseStock } from "../models/postgresInventoryModel.js";
import { publishInventoryEvent, publishDbUpdateEvent } from "./producer.js";
import dotenv from "dotenv";

dotenv.config();

const TOPIC_ORDER_EVENTS = process.env.KAFKA_TOPIC_ORDER_EVENTS || "order-events";

const consumer = kafka.consumer({
  groupId: "inventory-service-order-listener",
});

export const startInventoryConsumer = async () => {
  try {
    await consumer.connect();
    console.log("Inventory Saga Order Consumer connected.");

    await consumer.subscribe({
      topic: TOPIC_ORDER_EVENTS,
      fromBeginning: false,
    });
    console.log(`Subscribed to topic: ${TOPIC_ORDER_EVENTS}`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawMessage = message.value.toString();
          const { eventType, data } = JSON.parse(rawMessage);

          console.log(`\n[Inventory Order Consumer] Event received: ${eventType}`, data);

          if (eventType === "OrderCreated") {
            const { orderId, productId, quantity } = data;
            console.log(
              `[Inventory Write] Checking & reserving PostgreSQL stock for Order #${orderId} (Product: ${productId}, Qty: ${quantity})...`
            );

            // 1. Write command to PostgreSQL
            const reservationResult = await reserveStock(productId, quantity);

            if (reservationResult.success) {
              console.log(
                `[Inventory Write] PostgreSQL stock RESERVED for Order #${orderId}. Remaining: ${reservationResult.remainingStock}`
              );

              // 2. CQRS: Emit DB update event so MongoDB syncs stock
              await publishDbUpdateEvent("ProductUpdated", reservationResult.product);

              // 3. Saga: Emit InventoryReserved to notify Order Service
              await publishInventoryEvent("InventoryReserved", {
                orderId,
                productId,
                quantity,
                remainingStock: reservationResult.remainingStock,
              });
            } else {
              console.log(
                `[Inventory Write] Stock reservation FAILED for Order #${orderId}: ${reservationResult.reason}`
              );

              // Saga: Emit InventoryReservationFailed to notify Order Service
              await publishInventoryEvent("InventoryReservationFailed", {
                orderId,
                productId,
                quantity,
                reason: reservationResult.reason,
              });
            }
          } else if (eventType === "OrderCancelled") {
            const { orderId, productId, quantity } = data;
            console.log(
              `[Inventory Write] Order #${orderId} cancelled. Releasing stock in PostgreSQL (Product: ${productId}, Qty: ${quantity})...`
            );

            // 1. Write command to PostgreSQL
            const releaseResult = await releaseStock(productId, quantity);

            if (releaseResult.product) {
              console.log(
                `[Inventory Write] Stock RELEASED in PostgreSQL for Order #${orderId}. Current: ${releaseResult.remainingStock}`
              );

              // 2. CQRS: Emit DB update event so MongoDB syncs stock
              await publishDbUpdateEvent("ProductUpdated", releaseResult.product);
            }
          }
        } catch (msgErr) {
          console.error("Error processing message in Inventory Consumer:", msgErr.message);
        }
      },
    });
  } catch (error) {
    console.error("Failed to start Inventory Consumer:", error.message);
  }
};
