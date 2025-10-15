import express from "express";
import { addHotspotUser, getHotspotUsersStatus, deleteHotspotUser } from "../controllers/hotspotController.js";
import { authenticateToken } from "../middleware/auth.js"; // pakai file yang sudah ada

const router = express.Router();

// Semua endpoint butuh login
router.post("/add", authenticateToken, addHotspotUser);
router.get("/status/:pelanggan_id", authenticateToken, getHotspotUsersStatus);
router.post("/delete", authenticateToken, deleteHotspotUser);

export default router;
