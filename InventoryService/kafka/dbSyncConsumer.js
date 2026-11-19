import { kafka } from "./client.js";
import { upsertToMongo, deleteFromMongo } from "../models/mongoInventoryModel.js";
import dotenv from "dotenv";

dotenv.config();

const TOPIC_INVENTORY_DB_UPDATE = process.env.KAFKA_TOPIC_INVENTORY_DB_UPDATE || "inventory-DBupdate-events";

const dbSyncConsumer = kafka.consumer({
  groupId: "inventory-mongo-sync-group",
});

export const startDbSyncConsumer = async () => {
  try {
    await dbSyncConsumer.connect();
    console.log("CQRS MongoDB Sync Consumer connected.");

    await dbSyncConsumer.subscribe({
      topic: TOPIC_INVENTORY_DB_UPDATE,
      fromBeginning: true, // Process events to guarantee eventual consistency
    });
    console.log(`CQRS Sync subscribed to topic: ${TOPIC_INVENTORY_DB_UPDATE}`);

    await dbSyncConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawMessage = message.value.toString();
          const { eventType, data } = JSON.parse(rawMessage);

          console.log(`\n[CQRS DB Sync] Processing event '${eventType}' for Product: ${data.productId}`);

          if (eventType === "ProductCreated" || eventType === "ProductUpdated") {
            const syncedDoc = await upsertToMongo({
              productId: data.productId,
              name: data.name,
              stock: data.stock,
              price: data.price,
            });
            console.log(
              `[CQRS DB Sync] Successfully synced to MongoDB: ${data.productId} (Stock: ${data.stock}, Price: $${data.price})`
            );
          } else if (eventType === "ProductDeleted") {
            await deleteFromMongo(data.productId);
            console.log(`[CQRS DB Sync] Successfully deleted from MongoDB: ${data.productId}`);
          }
        } catch (syncErr) {
          console.error("Error synchronizing event to MongoDB:", syncErr.message);
        }
      },
    });
  } catch (error) {
    console.error("Failed to start CQRS MongoDB Sync Consumer:", error.message);
  }
};
