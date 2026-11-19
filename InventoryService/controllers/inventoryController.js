import * as PgModel from "../models/postgresInventoryModel.js";
import * as MongoModel from "../models/mongoInventoryModel.js";
import { publishDbUpdateEvent } from "../kafka/producer.js";

// ==========================================
// CQRS WRITE OPERATIONS (PostgreSQL + Kafka)
// ==========================================

// 1. Add Product (Write: PostgreSQL -> Kafka Event -> MongoDB Sync)
export const addProduct = async (req, res) => {
  try {
    const { productId, name, stock, price } = req.body;

    if (!productId || !name) {
      return res.status(400).json({
        success: false,
        error: "Both 'productId' and 'name' are required fields.",
      });
    }

    const initialStock = stock !== undefined ? Number(stock) : 0;
    const initialPrice = price !== undefined ? Number(price) : 0.0;

    // Step 1: Write to PostgreSQL
    const savedProduct = await PgModel.addProduct({
      productId: String(productId).trim(),
      name: String(name).trim(),
      stock: initialStock,
      price: initialPrice,
    });

    console.log(`[CQRS Write] Product '${productId}' saved in PostgreSQL.`);

    // Step 2: Push event to Kafka (topic: inventory-DBupdate-events)
    try {
      await publishDbUpdateEvent("ProductCreated", savedProduct);
    } catch (kafkaErr) {
      console.error("Warning: Failed to publish ProductCreated to Kafka:", kafkaErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Product saved to PostgreSQL and sync event emitted to Kafka.",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    return res.status(500).json({ success: false, error: "Internal server error adding product." });
  }
};

// 2. Update Product (Write: PostgreSQL -> Kafka Event -> MongoDB Sync)
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, stock, price } = req.body;

    const existing = await PgModel.getPostgresProduct(productId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Product '${productId}' not found in PostgreSQL.`,
      });
    }

    // Step 1: Update in PostgreSQL
    const updatedProduct = await PgModel.updateProduct(productId, { name, stock, price });

    console.log(`[CQRS Write] Product '${productId}' updated in PostgreSQL.`);

    // Step 2: Push event to Kafka (topic: inventory-DBupdate-events)
    try {
      await publishDbUpdateEvent("ProductUpdated", updatedProduct);
    } catch (kafkaErr) {
      console.error("Warning: Failed to publish ProductUpdated to Kafka:", kafkaErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Product updated in PostgreSQL and sync event emitted to Kafka.",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ success: false, error: "Internal server error updating product." });
  }
};

// 3. Delete Product (Write: PostgreSQL -> Kafka Event -> MongoDB Sync)
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const existing = await PgModel.getPostgresProduct(productId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Product '${productId}' not found in PostgreSQL.`,
      });
    }

    // Step 1: Delete from PostgreSQL
    const deletedProduct = await PgModel.deleteProduct(productId);

    console.log(`[CQRS Write] Product '${productId}' deleted from PostgreSQL.`);

    // Step 2: Push event to Kafka (topic: inventory-DBupdate-events)
    try {
      await publishDbUpdateEvent("ProductDeleted", { productId });
    } catch (kafkaErr) {
      console.error("Warning: Failed to publish ProductDeleted to Kafka:", kafkaErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted from PostgreSQL and sync event emitted to Kafka.",
      data: deletedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, error: "Internal server error deleting product." });
  }
};

// ==========================================
// CQRS READ OPERATIONS (MongoDB Read Store)
// ==========================================

// 4. Get All Products (Read from MongoDB)
export const getAllInventory = async (req, res) => {
  try {
    const items = await MongoModel.getAllFromMongo();
    return res.status(200).json({
      success: true,
      source: "MongoDB (CQRS Read Store)",
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Error reading inventory from MongoDB:", error);
    return res.status(500).json({ success: false, error: "Internal server error reading inventory from MongoDB." });
  }
};

// 5. Get Product Stock (Read from MongoDB)
export const getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const item = await MongoModel.getByProductIdFromMongo(productId);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Product '${productId}' not found in MongoDB read store.`,
      });
    }

    return res.status(200).json({
      success: true,
      source: "MongoDB (CQRS Read Store)",
      data: item,
    });
  } catch (error) {
    console.error("Error reading product from MongoDB:", error);
    return res.status(500).json({ success: false, error: "Internal server error reading product from MongoDB." });
  }
};
