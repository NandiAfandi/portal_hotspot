import { RouterOSClient } from "routeros-client";
import dotenv from "dotenv";

dotenv.config();

const mikrotikConfig = {
  host: process.env.MIKROTIK_HOST,
  user: process.env.MIKROTIK_USER,
  password: process.env.MIKROTIK_PASSWORD,
  port: 8728,
};

// 🔹 Ambil semua user hotspot aktif
export const getActiveUsers = async () => {
  const api = new RouterOSClient(mikrotikConfig);

  try {
    const client = await api.connect();
    const hotspotActive = client.menu("/ip/hotspot/active");
    const users = await hotspotActive.getAll();
    await api.close();
    return users;
  } catch (err) {
    console.error("❌ Gagal mengambil data user aktif:", err.message);
    await api.close();
    return [];
  }
};

// 🔹 Tambah user hotspot baru
export const addHotspotUser = async (username, password, profile) => {
  const api = new RouterOSClient(mikrotikConfig);

  try {
    const client = await api.connect();
    const hotspotUser = client.menu("/ip/hotspot/user");
    const result = await hotspotUser.add({
      name: username,
      password: password,
      profile: profile,
    });
    await api.close();
    return result;
  } catch (err) {
    console.error("❌ Gagal menambah user:", err.message);
    await api.close();
    return null;
  }
};

// 🔹 Hapus user hotspot
export const deleteHotspotUser = async (username) => {
  const api = new RouterOSClient(mikrotikConfig);

  try {
    const client = await api.connect();
    const hotspotUser = client.menu("/ip/hotspot/user");
    const user = await hotspotUser.get({ name: username });
    if (user.length > 0) {
      await hotspotUser.remove(user[0][".id"]);
      console.log(`✅ User ${username} dihapus`);
    }
    await api.close();
  } catch (err) {
    console.error("❌ Gagal hapus user:", err.message);
    await api.close();
  }
};

// 🔹 Putuskan koneksi user aktif
export const disconnectUser = async (username) => {
  const api = new RouterOSClient(mikrotikConfig);

  try {
    const client = await api.connect();
    const hotspotActive = client.menu("/ip/hotspot/active");
    const user = await hotspotActive.get({ user: username });
    if (user.length > 0) {
      await hotspotActive.remove(user[0][".id"]);
      console.log(`⚡ User ${username} terputus`);
    }
    await api.close();
  } catch (err) {
    console.error("❌ Gagal memutus koneksi:", err.message);
    await api.close();
  }
};
