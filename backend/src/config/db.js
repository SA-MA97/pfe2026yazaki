import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'yazaki_db',
  password: String(process.env.DB_PASSWORD || ''),
  port: Number(process.env.DB_PORT || 5432),
});

pool.on("connect", () => {
  console.log("⚡ Pool de connexion établi avec la Base de Données PostgreSQL");
});

export default pool;