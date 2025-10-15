import { RouterOSClient } from "routeros-client";

const mikrotik = new RouterOSClient({
  host: "192.168.32.1",   // ganti dengan IP router kamu
  user: "admin",          // username Mikrotik
  password: "SPakaz@24",           // password Mikrotik
  port: 8728,
});

(async () => {
  try {
    await mikrotik.connect();
    console.log("✅ Berhasil terhubung ke Mikrotik API");
    await mikrotik.close();
  } catch (err) {
    console.error("❌ Gagal terhubung:", err.message);
  }
})();
