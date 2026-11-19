import { query } from "../db.js";

// Initialize PostgreSQL table
export const createOrderTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INT DEFAULT 1,
      product_id VARCHAR(100) NOT NULL,
      quantity INT NOT NULL,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await query(sql);
    console.log("PostgreSQL 'orders' table is ready.");
  } catch (error) {
    console.error("Error creating 'orders' table:", error);
    throw error;
  }
};

// Create a new order (default userId = 1)
export const createOrder = async ({ userId = 1, productId, quantity, price = 0 }) => {
  const sql = `
    INSERT INTO orders (user_id, product_id, quantity, price, status)
    VALUES ($1, $2, $3, $4, 'PENDING')
    RETURNING *;
  `;
  const result = await query(sql, [userId, productId, quantity, price]);
  return result.rows[0];
};

// Get order by ID
export const getOrderById = async (id) => {
  const sql = `SELECT * FROM orders WHERE id = $1;`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

// Get all orders (default filter by userId = 1)
export const getAllOrders = async (userId = 1) => {
  const sql = `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC;`;
  const result = await query(sql, [userId]);
  return result.rows;
};

// Update order details (e.g. quantity, price)
export const updateOrder = async (id, { quantity, price }) => {
  const updates = [];
  const values = [];
  let index = 1;

  if (quantity !== undefined) {
    updates.push(`quantity = $${index++}`);
    values.push(quantity);
  }

  if (price !== undefined) {
    updates.push(`price = $${index++}`);
    values.push(price);
  }

  if (updates.length === 0) return await getOrderById(id);

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const sql = `
    UPDATE orders
    SET ${updates.join(", ")}
    WHERE id = $${index}
    RETURNING *;
  `;

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// Update order status (PENDING, CONFIRMED, CANCELLED, FAILED)
export const updateOrderStatus = async (id, status) => {
  const sql = `
    UPDATE orders
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;
  const result = await query(sql, [status, id]);
  return result.rows[0] || null;
};

// Cancel order
export const cancelOrder = async (id) => {
  return await updateOrderStatus(id, "CANCELLED");
};
