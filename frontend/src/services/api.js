const ORDER_SERVICE_URL = "http://localhost:4000";
const INVENTORY_SERVICE_URL = "http://localhost:4001";

// ==========================================
// INVENTORY SERVICE APIS (Port 4001)
// ==========================================

// Read from MongoDB (CQRS Query)
export const fetchInventory = async () => {
  const res = await fetch(`${INVENTORY_SERVICE_URL}/inventory`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  const json = await res.json();
  return json.data || [];
};

// Write to PostgreSQL -> Kafka -> MongoDB (CQRS Command)
export const addProduct = async (productData) => {
  const res = await fetch(`${INVENTORY_SERVICE_URL}/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to add product");
  return json;
};

// Update in PostgreSQL -> Kafka -> MongoDB
export const updateProduct = async (productId, updateData) => {
  const res = await fetch(`${INVENTORY_SERVICE_URL}/inventory/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update product");
  return json;
};

// Delete from PostgreSQL -> Kafka -> MongoDB
export const deleteProduct = async (productId) => {
  const res = await fetch(`${INVENTORY_SERVICE_URL}/inventory/${productId}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete product");
  return json;
};

// ==========================================
// ORDER SERVICE APIS (Port 4000)
// ==========================================

// Get all orders (PostgreSQL)
export const fetchOrders = async () => {
  const res = await fetch(`${ORDER_SERVICE_URL}/orders`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  const json = await res.json();
  return json.data || [];
};

// Create order (PostgreSQL -> emits OrderCreated to Kafka for Saga)
export const createOrder = async (orderData) => {
  const res = await fetch(`${ORDER_SERVICE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create order");
  return json;
};

// Cancel order (PostgreSQL -> emits OrderCancelled to Kafka for Saga)
export const cancelOrder = async (orderId) => {
  const res = await fetch(`${ORDER_SERVICE_URL}/orders/${orderId}/cancel`, {
    method: "PUT",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to cancel order");
  return json;
};

// Check health of microservices
export const checkServicesHealth = async () => {
  const results = { orderService: false, inventoryService: false };
  try {
    const oRes = await fetch(`${ORDER_SERVICE_URL}/`, { signal: AbortSignal.timeout(2000) });
    results.orderService = oRes.ok;
  } catch {
    results.orderService = false;
  }

  try {
    const iRes = await fetch(`${INVENTORY_SERVICE_URL}/`, { signal: AbortSignal.timeout(2000) });
    results.inventoryService = iRes.ok;
  } catch {
    results.inventoryService = false;
  }

  return results;
};
