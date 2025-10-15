// controllers/authController.js
import axios from "axios";
import db from "../config/db.js";
import jwt from "jsonwebtoken";
import { setActiveToken, removeActiveToken } from "../middleware/auth.js";

const otpStore = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 menit
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

/**
 * [1] Request OTP
 */
export const requestOtp = async (req, res) => {
  const { whatsapp } = req.body;
  if (!whatsapp) return res.status(400).json({ message: "Nomor WhatsApp wajib diisi" });

  try {
    const [rows] = await db.promise().query("SELECT * FROM pelanggan WHERE whatsapp = ?", [whatsapp]);
    if (rows.length === 0) return res.status(404).json({ message: "Nomor WhatsApp belum terdaftar" });

    const otp = generateOtp();
    otpStore[whatsapp] = { otp, expiredAt: Date.now() + OTP_EXPIRY_MS };

    const tokenWablas = process.env.WABLAS_TOKEN;
    const secretWablas = process.env.WABLAS_SECRET;
    const message = encodeURIComponent(`Kode OTP Anda: ${otp}`);
    const url = `https://jogja.wablas.com/api/send-message?token=${tokenWablas}.${secretWablas}&phone=${whatsapp}&message=${message}`;

    await axios.get(url);
    return res.json({ message: "OTP terkirim ke WhatsApp Anda" });
  } catch (err) {
    console.error("❌ Gagal kirim OTP:", err.response ? err.response.data : err.message);
    return res.status(500).json({ message: "Gagal mengirim OTP, coba lagi" });
  }
};

/**
 * [2] Verify OTP dan login
 */
export const verifyOtp = async (req, res) => {
  const { whatsapp, otp } = req.body;
  if (!whatsapp || !otp) return res.status(400).json({ message: "Nomor WhatsApp dan OTP wajib diisi" });

  const stored = otpStore[whatsapp];
  if (!stored || Date.now() > stored.expiredAt) {
    delete otpStore[whatsapp];
    return res.status(400).json({ message: "OTP tidak ditemukan atau sudah kadaluarsa" });
  }

  if (parseInt(otp) !== stored.otp) return res.status(400).json({ message: "Kode OTP salah" });

  delete otpStore[whatsapp]; // OTP terpakai, hapus dari memori

  try {
    const [rows] = await db.promise().query("SELECT * FROM pelanggan WHERE whatsapp = ?", [whatsapp]);
    if (rows.length === 0) return res.status(404).json({ message: "Nomor WhatsApp belum terdaftar" });

    const pelanggan = rows[0];
    const token = jwt.sign(
      { id: pelanggan.id, whatsapp: pelanggan.whatsapp },
      process.env.JWT_SECRET,
      { expiresIn: "3d" } // token berlaku 3 hari
    );

    // Simpan token aktif untuk single session
    setActiveToken(pelanggan.id, token);

    return res.json({
      message: "Login berhasil",
      token,
      pelanggan: {
        id: pelanggan.id,
        nama: pelanggan.nama,
        whatsapp: pelanggan.whatsapp,
        paket: pelanggan.paket
      }
    });
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

/**
 * [3] Logout (opsional)
 */
export const logout = async (req, res) => {
  const { id } = req.user;
  removeActiveToken(id);
  return res.json({ message: "Logout berhasil" });
};
