import express from "express";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getAllInventory,
  getProductStock,
} from "../controllers/inventoryController.js";

const router = express.Router();

// CQRS Read Routes (served by MongoDB)
router.get("/", getAllInventory);
router.get("/:productId", getProductStock);

// CQRS Write Routes (served by PostgreSQL -> Kafka event -> MongoDB sync)
router.post("/", addProduct);
router.post("/product", addProduct);
router.put("/:productId", updateProduct);
router.delete("/:productId", deleteProduct);

export default router;
