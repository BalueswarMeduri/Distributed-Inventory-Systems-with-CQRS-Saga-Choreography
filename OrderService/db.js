import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.POSTGRELSQL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Warning: POSTGRELSQL connection string is not defined in .env");
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const query = (text, params) => pool.query(text, params);
