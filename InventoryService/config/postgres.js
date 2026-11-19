import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

let connectionString = process.env.POSTGRES_URI || "";
// Strip channel_binding if present to ensure node-pg compatibility
connectionString = connectionString.replace(/[?&]channel_binding=require/g, "");

if (!connectionString) {
  console.error("Warning: POSTGRES_URI is not defined in .env");
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const query = (text, params) => pool.query(text, params);

// Auto-initialize inventory table in PostgreSQL
export const createInventoryTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS inventory (
      product_id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await query(sql);
    console.log("PostgreSQL 'inventory' table is ready.");
  } catch (error) {
    console.error("Error creating 'inventory' table in PostgreSQL:", error);
    throw error;
  }
};
