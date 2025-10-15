import express from "express";
import { addHotspotUser, getHotspotUsersStatus, deleteHotspotUser } from "../controllers/hotspotController.js";

const router = express.Router();

// Endpoint untuk menambah user hotspot
router.post("/add", addHotspotUser);
// Endpoint untuk cek status user hotspot per pelanggan
router.get("/status/:pelanggan_id", getHotspotUsersStatus);
// Endpoint untuk menghapus user
router.post("/delete", deleteHotspotUser);

export default router;
