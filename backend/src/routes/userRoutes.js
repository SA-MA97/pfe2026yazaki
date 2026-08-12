import express from "express";
import { creatUsers, getAllUsers, getUserById, updateUsers, deleteUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/",creatUsers);
router.get("/",getAllUsers);
router.get("/:id",getUserById);
router.put("/:id",updateUsers);
router.delete("/:id",deleteUsers);



export default router; 