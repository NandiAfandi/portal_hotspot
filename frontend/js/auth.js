import { API_BASE } from "./api.js";

// Tambahkan event listener agar fungsi tidak perlu inline onclick
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnOtp").addEventListener("click", requestOtp);
  document.getElementById("btnVerify").addEventListener("click", verifyOtp);
});

// 🔒 Cek apakah sudah login
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const pelanggan = JSON.parse(localStorage.getItem("pelanggan"));

  if (token && pelanggan) {
    // langsung redirect ke dashboard
    window.location.href = "dashboard.html";
  }
});


async function requestOtp() {
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const status = document.getElementById("status");
  if (!whatsapp) return Swal.fire("Masukkan nomor WhatsApp!");

  status.textContent = "Mengirim OTP...";
  try {
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp }),
    });

    const data = await res.json();
    status.textContent = data.message || "OTP telah dikirim ke WhatsApp Anda!";
  } catch (err) {
    console.error(err);
    status.textContent = "Gagal mengirim OTP.";
  }
}

async function verifyOtp() {
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const status = document.getElementById("status");
  if (!whatsapp || !otp) return Swal.fire("Peringatan", "Isi nomor dan OTP!", "warning");

  status.textContent = "Memverifikasi OTP...";
  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp, otp }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("pelanggan", JSON.stringify(data.pelanggan));
      Swal.fire({
      title: "Login Berhasil 🎉",
      text: `Selamat datang, ${data.pelanggan.nama}!`,
      icon: "success",
      confirmButtonText: "Lanjut ke Dashboard",
    }).then(() => {
      window.location.href = "dashboard.html";
    });
  } else {
    Swal.fire("Gagal", data.message || "OTP salah atau sudah kedaluwarsa.", "error");
  }
  } catch (err) {
    console.error(err);
    status.textContent = "Terjadi kesalahan saat verifikasi.";
  }
}

async function logout() {
  const token = localStorage.getItem("token");
  if (!token) return;

  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  localStorage.clear();
  alert("Anda telah logout.");
  window.location.href = "index.html";
}
