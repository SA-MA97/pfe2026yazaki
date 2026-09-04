import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import pool from "./config/db.js"; 
import userRoutes from "./routes/userRoutes.js";
import transportRoutes from "./routes/transportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { initDatabaseTables } from "./models/transportModel.js";


dotenv.config();

const app = express();
const port = process.env.PORT || 5001; 

// Middlewares
app.use(compression());
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/auth", authRoutes);

// Root route - Database test
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    res.json({
      status: "Online",
      database: result.rows[0].current_database,
      message: "API YAZAKI Transport Management fonctionnelle"
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: error.message });
  }
});

// Error handling middleware
app.use(errorHandler);
 

// Initialize DB tables and start server
initDatabaseTables().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Serveur Backend YAZAKI démarré sur : http://localhost:${port}`);
  });
});
