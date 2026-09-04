import express from 'express';
import {
  loginStep1,
  loginStep2,
  forgotPassword,
  resetPassword,
  resendOtp,
  listAdmins,
  createAdminAccount,
  deleteAdminAccount,
  changePassword,
} from '../controllers/authController.js';

const router = express.Router();

// ─── Auth / Login ────────────────────────────────────────────
router.post('/login',           loginStep1);
router.post('/resend-otp',      resendOtp);
router.post('/verify-otp',      loginStep2);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// ─── Gestion des comptes admin (super_admin only) ────────────
router.get('/admin/list',       listAdmins);
router.post('/admin/create',    createAdminAccount);
router.delete('/admin/:email',  deleteAdminAccount);

// ─── Profil — changer le mot de passe ───────────────────────
router.post('/change-password', changePassword);

export default router;
