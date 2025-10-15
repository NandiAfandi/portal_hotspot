import express from "express";
import { requestOtp, verifyOtp, logout } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Request OTP
router.post("/request-otp", requestOtp);

// Verify OTP dan login (mengembalikan token)
router.post("/verify-otp", verifyOtp);

// Logout (opsional, hapus token aktif)
router.post("/logout", authenticateToken, logout);

export default router;
