import { API_BASE } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const pelanggan = JSON.parse(localStorage.getItem("pelanggan"));

  if (!token || !pelanggan) {
    Swal.fire("Sesi Habis", "Silakan login ulang.", "warning").then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  // 🟢 Tampilkan sapaan
  const welcomeText = document.getElementById("welcomeText");
  welcomeText.textContent = `Selamat datang, ${pelanggan.nama}! 👋`;

  const tbody = document.getElementById("userTableBody");

  try {
    const res = await fetch(`${API_BASE}/hotspot/status/${pelanggan.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 403) {
      Swal.fire("Sesi Berakhir", "Silakan login ulang..", "warning").then(() => {
        localStorage.clear();
        window.location.href = "index.html";
      });
      return;
    }

    const data = await res.json();
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">Belum ada user hotspot.</td></tr>`;
      return;
    }

    data.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.kode_akses}</td>
        <td>${user.status}</td>
        <td>${user.ip ?? "-"}</td>
        <td>${user.uptime ?? "-"}</td>
        <td><button class="btn-delete" data-kode="${user.kode_akses}">Hapus</button></td>
      `;
      tbody.appendChild(row);
    });

    // 🔴 Tombol hapus
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const kode = e.target.dataset.kode;
        const confirm = await Swal.fire({
          title: "Konfirmasi",
          text: `Yakin mau hapus user ${kode}?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya, hapus",
          cancelButtonText: "Batal",
        });

        if (!confirm.isConfirmed) return;
        const delRes = await fetch(`${API_BASE}/hotspot/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ kode_akses: kode }),
        });

        const result = await delRes.json();
         Swal.fire(result.message, "", delRes.ok ? "success" : "error").then(() => {
          if (delRes.ok) window.location.href = "index.html";
        });
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Gagal memuat data.</td></tr>`;
    console.error(err);
  }

  // 🟡 Tombol Tambah User
  document.getElementById("addUserBtn").addEventListener("click", async () => {
    const { value: kode } = await Swal.fire({
      title: "Tambah User Hotspot",
      input: "text",
      inputLabel: "Masukkan kode akses baru",
      inputPlaceholder: "contoh: SENKIRI34",
      showCancelButton: true,
      confirmButtonText: "Tambah",
      cancelButtonText: "Batal",
      inputValidator: (value) => !value && "Kode akses wajib diisi!",
    });

    try {
      const res = await fetch(`${API_BASE}/hotspot/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pelanggan_id: pelanggan.id,
          kode_akses: kode,
        }),
      });

      const data = await res.json();
      Swal.fire(data.message, "", res.ok ? "success" : "error").then(() => {
        if (res.ok) location.reload();
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal menambahkan user hotspot.", "error");
    }
  });

  // 🟣 Tombol Logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.clear();
    Swal.fire("Logout Berhasil", "Sampai jumpa lagi 👋", "success").then(() => {
      window.location.href = "index.html";
    });
  });
});
