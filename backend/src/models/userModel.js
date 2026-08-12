import pool from "../config/db.js";



export const getAllUsersService= async () => {
    const result = await pool.query("SELECT * FROM users");
    return result.rows;
};

export const getUserByIdService = async (id) => {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
};

export const createUserService = async (name, email) => {
    const result = await pool.query("INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *", [name, email]);
    return result.rows[0];
};

export const updateUserService = async (id, name, email) => {
    const result = await pool.query("UPDATE users SET name = $2, email = $3 WHERE id = $1 RETURNING *", [id, name, email]);
    return result.rows[0];
};

export const deleteUserService = async (id) => {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
    return result.rows[0];
};


