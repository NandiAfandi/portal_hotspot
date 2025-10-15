// controllers/hotspotController.js
import db from "../config/db.js";
import createMikrotikConnection from "../config/mikrotik.js";

// Fungsi utama menambah user hotspot
export const addHotspotUser = async (req, res) => {
  const { pelanggan_id, kode_akses } = req.body;

  if (!pelanggan_id || !kode_akses) {
    return res.status(400).json({
      message: "ID pelanggan dan kode akses wajib diisi.",
    });
  }

  try {
    // 1️⃣ Ambil data pelanggan
    const [pelangganRows] = await db
      .promise()
      .query("SELECT * FROM pelanggan WHERE id = ?", [pelanggan_id]);

    if (pelangganRows.length === 0) {
      return res.status(404).json({ message: "Pelanggan tidak ditemukan." });
    }

    const pelanggan = pelangganRows[0];

    // 2️⃣ Hitung jumlah kode akses yang sudah dibuat
    const [userRows] = await db
      .promise()
      .query(
        "SELECT COUNT(*) AS jumlah FROM hotspot_users WHERE pelanggan_id = ?",
        [pelanggan_id]
      );

    const totalUser = userRows[0].jumlah;
    if (totalUser >= pelanggan.max_user) {
      return res.status(400).json({
        message:
          "Sudah mencapai batas maksimal kode akses sesuai paket pelanggan.",
      });
    }

    // 3️⃣ Koneksi ke Mikrotik
    const { api, client } = await createMikrotikConnection();

    // 4️⃣ Ambil menu hotspot user
    const hotspotUserMenu = client.menu("/ip/hotspot/user");

    // 5️⃣ Tambahkan user hotspot
    await hotspotUserMenu.add({
      name: kode_akses,
      password: kode_akses,
      profile: "portal_hotspot", // profil fixed
      comment: `${pelanggan.id} - ${pelanggan.nama}`,
    });

    // 6️⃣ Simpan ke database
    await db
      .promise()
      .query(
        "INSERT INTO hotspot_users (pelanggan_id, kode_akses) VALUES (?, ?)",
        [pelanggan_id, kode_akses]
      );

    // 7️⃣ Tutup koneksi Mikrotik
    await api.close();

    return res.status(200).json({
      message: "Kode akses berhasil dibuat.",
      kode_akses,
    });
  } catch (error) {
    console.error("❌ Gagal menambah user hotspot:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat menambah user hotspot.",
    });
  }
};

export const getHotspotUsersStatus = async (req, res) => {
  const { pelanggan_id } = req.params;

  if (!pelanggan_id) {
    return res.status(400).json({ message: "ID pelanggan wajib diisi." });
  }

  try {
    // 1️⃣ Ambil data pelanggan
    const [pelangganRows] = await db
      .promise()
      .query("SELECT * FROM pelanggan WHERE id = ?", [pelanggan_id]);

    if (pelangganRows.length === 0) {
      return res.status(404).json({ message: "Pelanggan tidak ditemukan." });
    }

    const pelanggan = pelangganRows[0];

    // 2️⃣ Ambil semua kode akses milik pelanggan
    const [hotspotUsers] = await db
      .promise()
      .query(
        "SELECT kode_akses FROM hotspot_users WHERE pelanggan_id = ?",
        [pelanggan_id]
      );

    // 3️⃣ Koneksi ke Mikrotik
    const { api, client } = await createMikrotikConnection();
    const hotspotActiveMenu = client.menu("/ip/hotspot/active");

    // 4️⃣ Ambil semua user aktif milik pelanggan berdasarkan comment
    const activeUsers = await hotspotActiveMenu.get({
      comment: `${pelanggan.id} - ${pelanggan.nama}`,
    });

    // 5️⃣ Cocokkan dengan kode akses di database
    const result = hotspotUsers.map((user) => {
      const active = activeUsers.find((au) => au.user === user.kode_akses);
      return {
        kode_akses: user.kode_akses,
        status: active ? "online" : "offline",
        ip: active ? active.address : null,
        uptime: active ? active.uptime : null,
      };
    });

    await api.close();

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Gagal mengambil status user hotspot:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil status user hotspot.",
    });
  }
};

/**
 * Endpoint: DELETE /hotspot/user
 * Body: { "kode_akses": "NAFA001" }
 * 
 * Fungsi ini memutus koneksi user jika aktif, lalu menghapus user dari hotspot Mikrotik dan database.
 */
export const deleteHotspotUser = async (req, res) => {
  const { kode_akses } = req.body;

  if (!kode_akses) {
    return res.status(400).json({ message: "Kode akses wajib diisi." });
  }

  try {
    const { api, client } = await createMikrotikConnection();

    const hotspotActiveMenu = client.menu('/ip/hotspot/active');
    const hotspotUserMenu = client.menu('/ip/hotspot/user');

    // Cek apakah user sedang aktif
    const activeUsers = await hotspotActiveMenu.get({ user: kode_akses });
    if (activeUsers.length > 0) {
      const connectionId = activeUsers[0].id;
      console.log('🔥 Memutus koneksi dengan .id:', connectionId);
      await hotspotActiveMenu.remove(connectionId);
    } else {
      console.log(`⚠️ User ${kode_akses} tidak sedang aktif, skip disconnect.`);
    }

    // Cari user di Mikrotik
    const users = await hotspotUserMenu.get({ name: kode_akses });
    if (users.length === 0) {
      await api.close();
      return res.status(404).json({ message: `User ${kode_akses} tidak ditemukan.` });
    }

    // Hapus user di Mikrotik
    const userId = users[0].id;
    console.log('🗑️ Menghapus user di Mikrotik dengan .id:', userId);
    await hotspotUserMenu.remove(userId);

    // Hapus user di database
    const [deleteResult] = await db
      .promise()
      .query("DELETE FROM hotspot_users WHERE kode_akses = ?", [kode_akses]);

    console.log(`🗑️ User ${kode_akses} dihapus dari database.`);

    await api.close();

    return res.status(200).json({
      message: `User ${kode_akses} berhasil diputus (jika aktif) dan dihapus dari Mikrotik & database.`,
      affectedRows: deleteResult.affectedRows
    });
  } catch (error) {
    console.error('❌ Gagal memutus/hapus user hotspot:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat memutus/hapus user.' });
  }
};
