import express from "express";
import { createUsers, getAllUsers, getUsersById, updateUsers, deleteUsers } from "../controllers/userController.js";
import validateUsers  from "../middlewares/inputvalidator.js";

const router = express.Router();

router.post("/", validateUsers, createUsers);
router.get("/", getAllUsers);
router.get("/:id", getUsersById);
router.put("/:id", validateUsers, updateUsers);
router.delete("/:id", deleteUsers);


router.get('/', (req, res) => {
    res.send("List of users");
});

export default router; 