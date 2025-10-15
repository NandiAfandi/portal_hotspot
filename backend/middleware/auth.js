// middleware/auth.js
import jwt from "jsonwebtoken";

// Single session store: simpan token aktif per pelanggan_id
const sessionStore = {};

/**
 * Middleware untuk autentikasi token JWT
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: "Sesi tidak ditemukan" });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: "Sesi tidak valid atau expired" });

    // Cek single session
    const activeToken = sessionStore[payload.id];
    if (!activeToken || activeToken !== token) {
      return res.status(403).json({ message: "Sesi login sudah tidak valid. Silakan login ulang." });
    }

    req.user = payload;
    next();
  });
};

/**
 * Fungsi untuk menyimpan token aktif (single session)
 */
export const setActiveToken = (pelanggan_id, token) => {
  sessionStore[pelanggan_id] = token;
};

/**
 * Fungsi untuk menghapus token (logout)
 */
export const removeActiveToken = (pelanggan_id) => {
  delete sessionStore[pelanggan_id];
};
