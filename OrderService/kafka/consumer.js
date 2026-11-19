import { kafka } from "./client.js";
import { updateOrderStatus } from "../models/orderModel.js";
import dotenv from "dotenv";

dotenv.config();

const TOPIC_INVENTORY_EVENTS = process.env.KAFKA_TOPIC_INVENTORY_EVENTS || "inventory-events";

const consumer = kafka.consumer({
  groupId: "order-service-inventory-listener",
});

export const startOrderConsumer = async () => {
  try {
    await consumer.connect();
    console.log("Order Service Kafka Consumer connected.");

    await consumer.subscribe({
      topic: TOPIC_INVENTORY_EVENTS,
      fromBeginning: false,
    });
    console.log(`Subscribed to topic: ${TOPIC_INVENTORY_EVENTS}`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const raw = message.value.toString();
          const { eventType, data } = JSON.parse(raw);

          console.log(`\n[Order Service Consumer] Received: ${eventType}`, data);

          if (eventType === "InventoryReserved") {
            const { orderId } = data;
            const updated = await updateOrderStatus(orderId, "CONFIRMED");
            console.log(`[Order Service] Order #${orderId} status updated to CONFIRMED.`);
          } else if (eventType === "InventoryReservationFailed") {
            const { orderId, reason } = data;
            const updated = await updateOrderStatus(orderId, "FAILED");
            console.log(`[Order Service] Order #${orderId} status updated to FAILED (Reason: ${reason}).`);
          }
        } catch (err) {
          console.error("Error processing inventory event in Order Service:", err.message);
        }
      },
    });
  } catch (error) {
    console.error("Failed to start Order Service Kafka Consumer:", error.message);
  }
};
