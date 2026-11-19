import express from "express";
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrder,
  cancelOrder,
  trackOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Order CRUD & tracking routes
router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.get("/:id/track", trackOrder);
router.put("/:id", updateOrder);
router.put("/:id/cancel", cancelOrder);
router.patch("/:id/cancel", cancelOrder);

export default router;
