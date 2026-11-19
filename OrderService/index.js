import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import orderRoutes from "./routes/orderRoutes.js";
import { createOrderTable } from "./models/orderModel.js";
import { connectProducer } from "./kafka/producer.js";
import { initKafkaTopics } from "./kafka/client.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check / welcome route
app.get("/", (req, res) => {
  res.json({
    service: "Order Service",
    status: "Healthy",
    version: "1.0.0",
  });
});

// Order Routes
app.use("/orders", orderRoutes);
app.use("/api/orders", orderRoutes);

// Initialize DB table and start server
const startServer = async () => {
  try {
    await createOrderTable();
    await initKafkaTopics(["order-events"]);
    await connectProducer();
    app.listen(PORT, () => {
      console.log(`Order Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database table:", error);
    process.exit(1);
  }
};

startServer();
