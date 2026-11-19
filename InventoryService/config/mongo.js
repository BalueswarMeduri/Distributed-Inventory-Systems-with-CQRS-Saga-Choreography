import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI;

export const connectMongo = async () => {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully for Read operations (CQRS).");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export const disconnectMongo = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  } catch (error) {
    console.error("Error disconnecting MongoDB:", error);
  }
};
