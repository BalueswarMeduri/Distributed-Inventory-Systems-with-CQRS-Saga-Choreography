import { query } from "../config/postgres.js";

// 1. Add Product (or update if already exists)
export const addProduct = async ({ productId, name, stock = 0, price = 0.0 }) => {
  const sql = `
    INSERT INTO inventory (product_id, name, stock, price, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (product_id) 
    DO UPDATE SET 
      name = EXCLUDED.name,
      stock = EXCLUDED.stock,
      price = EXCLUDED.price,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const result = await query(sql, [productId, name, Number(stock), Number(price)]);
  return result.rows[0];
};

// 2. Update Product
export const updateProduct = async (productId, { name, stock, price }) => {
  const updates = [];
  const values = [];
  let index = 1;

  if (name !== undefined) {
    updates.push(`name = $${index++}`);
    values.push(name);
  }

  if (stock !== undefined) {
    updates.push(`stock = $${index++}`);
    values.push(Number(stock));
  }

  if (price !== undefined) {
    updates.push(`price = $${index++}`);
    values.push(Number(price));
  }

  if (updates.length === 0) {
    return await getPostgresProduct(productId);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(productId);

  const sql = `
    UPDATE inventory
    SET ${updates.join(", ")}
    WHERE product_id = $${index}
    RETURNING *;
  `;

  const result = await query(sql, values);
  return result.rows[0] || null;
};

// 3. Delete Product
export const deleteProduct = async (productId) => {
  const sql = `DELETE FROM inventory WHERE product_id = $1 RETURNING *;`;
  const result = await query(sql, [productId]);
  return result.rows[0] || null;
};

// 4. Reserve stock atomically
export const reserveStock = async (productId, quantity) => {
  const parsedQty = Number(quantity);

  // Check if product exists first
  const checkSql = `SELECT * FROM inventory WHERE product_id = $1;`;
  const checkRes = await query(checkSql, [productId]);
  const product = checkRes.rows[0];

  if (!product) {
    return {
      success: false,
      reason: `Product '${productId}' not found in PostgreSQL inventory.`,
    };
  }

  if (Number(product.stock) < parsedQty) {
    return {
      success: false,
      reason: `Insufficient stock for product '${productId}'. Requested: ${parsedQty}, Available: ${product.stock}.`,
      currentStock: Number(product.stock),
      product,
    };
  }

  // Atomic stock deduction
  const deductSql = `
    UPDATE inventory
    SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
    WHERE product_id = $2 AND stock >= $1
    RETURNING *;
  `;

  const deductRes = await query(deductSql, [parsedQty, productId]);
  const updatedProduct = deductRes.rows[0];

  if (!updatedProduct) {
    return {
      success: false,
      reason: `Concurrent conflict reserving stock for product '${productId}'.`,
    };
  }

  return {
    success: true,
    reservedQuantity: parsedQty,
    remainingStock: Number(updatedProduct.stock),
    product: updatedProduct,
  };
};

// 5. Release / compensate stock (e.g. order cancelled)
export const releaseStock = async (productId, quantity) => {
  const parsedQty = Number(quantity);
  const sql = `
    UPDATE inventory
    SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
    WHERE product_id = $2
    RETURNING *;
  `;
  const result = await query(sql, [parsedQty, productId]);
  const updatedProduct = result.rows[0];

  return {
    success: true,
    releasedQuantity: parsedQty,
    remainingStock: updatedProduct ? Number(updatedProduct.stock) : 0,
    product: updatedProduct,
  };
};

// 6. Get product directly from PostgreSQL (for verification/write fallback)
export const getPostgresProduct = async (productId) => {
  const sql = `SELECT * FROM inventory WHERE product_id = $1;`;
  const result = await query(sql, [productId]);
  return result.rows[0] || null;
};
