import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import { createInventoryTable } from "./config/postgres.js";
import { connectMongo } from "./config/mongo.js";
import { initKafkaTopics } from "./kafka/client.js";
import { connectProducer } from "./kafka/producer.js";
import { startInventoryConsumer } from "./kafka/consumer.js";
import { startDbSyncConsumer } from "./kafka/dbSyncConsumer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health / root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Inventory Service (CQRS)",
    status: "Healthy",
    writeDatabase: "PostgreSQL",
    readDatabase: "MongoDB",
    version: "1.0.0",
  });
});

// Inventory Routes (CQRS: Writes -> PostgreSQL, Reads -> MongoDB)
app.use("/inventory", inventoryRoutes);
app.use("/api/inventory", inventoryRoutes);

// Start Server and all CQRS / Kafka workers
const startServer = async () => {
  try {
    // 1. Initialize PostgreSQL Write Table
    await createInventoryTable();

    // 2. Connect to MongoDB Read Database
    await connectMongo();

    // 3. Ensure all Kafka topics exist
    await initKafkaTopics([
      "inventory-events",
      "order-events",
      "inventory-DBupdate-events",
    ]);

    // 4. Connect Kafka producer
    await connectProducer();

    // 5. Start Kafka consumer for Order events (Saga: reserve/release stock)
    await startInventoryConsumer();

    // 6. Start Kafka consumer for CQRS DB synchronization (Postgres -> Kafka -> Mongo)
    await startDbSyncConsumer();

    // 7. Start HTTP server
    app.listen(PORT, () => {
      console.log(`Inventory Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Inventory Service:", error);
    process.exit(1);
  }
};

startServer();
