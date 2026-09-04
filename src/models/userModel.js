import pool from "../config/db.js";



export const getAllUsersService= async () => {
    const result = await pool.query("SELECT * FROM users");
    return result.rows;
};

export const getUsersByIdService = async (id) => {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
};

export const createUsersService = async (name, email, password) => {
    const result = await pool.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *", [name, email, password]);
    return result.rows[0];
};

export const updateUsersService = async (id, name, email, password) => {
    const result = await pool.query("UPDATE users SET name = $2, email = $3, password = $4 WHERE id = $1 RETURNING *", [id, name, email, password]);
    return result.rows[0];
};

export const deleteUsersService = async (id) => {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
    return result.rows[0];
};


