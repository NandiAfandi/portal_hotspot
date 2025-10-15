import axios from "axios";
import db from "../config/db.js";

// Simpan OTP sementara di memory
const otpStore = {};

// Fungsi untuk generate OTP random
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// === [1] REQUEST OTP ===
export const requestOtp = async (req, res) => {
  const { whatsapp } = req.body;
  if (!whatsapp)
    return res.status(400).json({ message: "Nomor WhatsApp wajib diisi" });

  // 🔍 Cek dulu apakah nomor terdaftar di database
  db.query(
    "SELECT * FROM pelanggan WHERE whatsapp = ?",
    [whatsapp],
    async (err, result) => {
      if (err) {
        console.error("❌ DB Error:", err.message);
        return res.status(500).json({ message: "Terjadi kesalahan server" });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Nomor WhatsApp belum terdaftar" });
      }

      // Kalau ada di database, baru kirim OTP
      const otp = generateOtp();
      const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit
      otpStore[whatsapp] = { otp, expiredAt };

      const token = process.env.WABLAS_TOKEN;
      const secret = process.env.WABLAS_SECRET;
      const message = encodeURIComponent(`Kode OTP Anda: ${otp}`);
      const url = `https://jogja.wablas.com/api/send-message?token=${token}.${secret}&phone=${whatsapp}&message=${message}`;

      try {
        const response = await axios.get(url);
        console.log("✅ Wablas response:", response.data);
        return res.json({ message: "OTP terkirim ke WhatsApp Anda" });
      } catch (err) {
        console.error(
          "❌ Gagal kirim OTP:",
          err.response ? err.response.data : err.message
        );
        return res
          .status(500)
          .json({ message: "Gagal mengirim OTP, coba lagi" });
      }
    }
  );
};

// === [2] VERIFY OTP ===
export const verifyOtp = async (req, res) => {
  const { whatsapp, otp } = req.body;
  if (!whatsapp || !otp)
    return res
      .status(400)
      .json({ message: "Nomor WhatsApp dan OTP wajib diisi" });

  const stored = otpStore[whatsapp];
  if (!stored)
    return res
      .status(400)
      .json({ message: "OTP tidak ditemukan atau sudah kadaluarsa" });

  if (new Date() > stored.expiredAt) {
    delete otpStore[whatsapp];
    return res.status(400).json({ message: "OTP sudah kadaluarsa" });
  }

  if (parseInt(otp) !== stored.otp)
    return res.status(400).json({ message: "Kode OTP salah" });

  // Hapus OTP dari memori setelah verifikasi berhasil
  delete otpStore[whatsapp];

  // Periksa apakah pelanggan terdaftar di database
  db.query(
    "SELECT * FROM pelanggan WHERE whatsapp = ?",
    [whatsapp],
    (err, result) => {
      if (err) {
        console.error("❌ DB Error:", err.message);
        return res.status(500).json({ message: "Terjadi kesalahan server" });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "Nomor WhatsApp belum terdaftar" });
      }

      // Jika sukses login
      return res.json({
        message: "Login berhasil",
        pelanggan: result[0],
      });
    }
  );
};
