import pool from '../config/db.js';

// ─── Initialiser la table admins ─────────────────────────────
export const initAdminTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      email              VARCHAR(255) PRIMARY KEY,
      name               VARCHAR(150) NOT NULL,
      password           VARCHAR(255) NOT NULL,
      is_super_admin     BOOLEAN DEFAULT FALSE,
      has_temp_password  BOOLEAN DEFAULT TRUE,
      temp_expires_at    TIMESTAMPTZ,
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      created_by         VARCHAR(255)
    );
  `);
};

// ─── Insérer les comptes initiaux (hardcodés) si absents ─────
export const seedDefaultAdmins = async () => {
  const defaults = [
    { email: 'admin@yazaki.com',          name: 'Superviseur Yazaki', password: 'admin123', isSuperAdmin: false },
    { email: 'hbibbascket@gmail.com',     name: 'Admin Test',         password: 'admin123', isSuperAdmin: false },
    { email: 'asma.garaja@isgb.ucar.tn', name: 'Asma Garaja',         password: 'admin123', isSuperAdmin: true  },
  ];

  for (const admin of defaults) {
    await pool.query(
      `INSERT INTO admins (email, name, password, is_super_admin, has_temp_password, temp_expires_at)
       VALUES ($1, $2, $3, $4, FALSE, NULL)
       ON CONFLICT (email) DO NOTHING`,
      [admin.email, admin.name, admin.password, admin.isSuperAdmin]
    );
  }
};

// ─── Trouver un admin par email ───────────────────────────────
export const findAdminByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM admins WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

// ─── Lister tous les admins (sans mot de passe) ───────────────
export const getAllAdmins = async () => {
  const result = await pool.query(
    `SELECT email, name, is_super_admin, has_temp_password, temp_expires_at, created_at, created_by
     FROM admins
     ORDER BY is_super_admin DESC, created_at ASC`
  );
  return result.rows;
};

// ─── Créer un nouveau admin avec mot de passe temporaire ──────
export const createAdmin = async (email, name, tempPassword, createdBy) => {
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // +72h
  const result = await pool.query(
    `INSERT INTO admins (email, name, password, is_super_admin, has_temp_password, temp_expires_at, created_by)
     VALUES ($1, $2, $3, FALSE, TRUE, $4, $5)
     RETURNING email, name, has_temp_password, created_at`,
    [email, name, tempPassword, expiresAt, createdBy]
  );
  return result.rows[0];
};

// ─── Changer le mot de passe ──────────────────────────────────
export const updatePassword = async (email, newPassword) => {
  await pool.query(
    `UPDATE admins
     SET password = $1, has_temp_password = FALSE, temp_expires_at = NULL
     WHERE email = $2`,
    [newPassword, email]
  );
};

// ─── Supprimer un admin ───────────────────────────────────────
export const deleteAdmin = async (email) => {
  const result = await pool.query(
    `DELETE FROM admins WHERE email = $1 AND is_super_admin = FALSE RETURNING email, name`,
    [email]
  );
  return result.rows[0] || null;
};
