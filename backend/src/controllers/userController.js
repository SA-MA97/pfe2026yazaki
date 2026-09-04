// Standardized response funtion
import { getAllUsersService,
         createUsersService,
         getUsersByIdService,
         updateUsersService,
         deleteUsersService
 } from "../models/userModel.js";
const handleResponse = (res, status, message, data=null) => {
    res.status(status).json({
        status,
        message,
        data,
    });
};

export const createUsers = async (req, res, next) => {
    const { name, email , password} = req.body;
    try {
        const newUser = await createUsersService(name, email, password);
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

export const getUsersById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await getUsersByIdService(id);
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
        const updateUsers = await updateUsersService(req.params.id, name, email, req.body.password);
        if (!updateUsers) return handleResponse(res, 404, "User not found");
        handleResponse(res, 200, "User updated successfully", updateUsers);
    } catch (error) {
        next(error);
    }
}; 

export const deleteUsers = async (req, res, next) => {
    try {
        const deleteUsers = await deleteUsersService(req.params.id);
        if (!deleteUsers) return handleResponse(res, 404, "User not found");
        handleResponse(res, 200, "User deleted successfully", deleteUsers);
    } catch (error) {
        next(error);
    }
};

