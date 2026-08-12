// Standardized response funtion
import { getAllUsersService,
         createUserService,
         getUserByIdService,
         updateUserService,
         deleteUserService
 } from "../models/userModel.js";
const handleResponse = (res, status, message, data=null) => {
    res.status(status).json({
        status,
        message,
        data,
    });
};

export const creatUsers = async (req, res, next) => {
    const { name, email } = req.body;
    try {
        const newUser = await createUserService(name, email);
        handleResponse(res, 201, "User created successfully", newUser);
    } catch (error) {
        next(error);
    }
}; 

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await getAllUsersService();
        handleResponse(res, 200, "Users fetched successfully", users);
    } catch (error) {
        next(error);
    }
}; 

export const getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await getUserByIdService(id);
        if (!user) {
            return handleResponse(res, 404, "User not found");
        }
        handleResponse(res, 200, "User retrieved successfully", user);
    } catch (error) {
        next(error);
    }
}; 

export const updateUsers = async (req, res, next) => {
    const { name, email } = req.body;
    try {
        const updateUser = await updateUserService(req.params.id, name, email);
        handleResponse(res, 200, "User updated successfully", User);
    } catch (error) {
        next(error);
    }
}; 

export const deleteUsers = async (req, res, next) => {
    try {
        const deleteUser = await deleteUserService(req.params.id);
        if (!deleteUser) return handleResponse(res, 404, "User not found");
        handleResponse(res, 200, "User deleted successfully", deleteUser);
    } catch (error) {
        next(error);
    }
};

