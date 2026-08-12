import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js"; 
import userRoutes from "./routes/userRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { getAllUsersService,
         createUserService,
         getUserByIdService,
         updateUserService,
         deleteUserService
 } from "./models/userModel.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001; 

//middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/api/user", userRoutes);

//error handling middleware
app.use(errorHandler);

//Creat table before starting the server
createUsersTable();

//testing POSTGRES connection
app.get("/",async(req , res )=>{
    const result = await pool.query("SELECT current_database()");
    res.send(`The database name is :${result.rows[0].current_database}`);
});



// server running 
app.listen(port,()=> {
    console.log(`server is running on http:localhost:${port}`);
});
