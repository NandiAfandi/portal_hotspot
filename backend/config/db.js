import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "portal_hotspot",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Gagal konek database:", err.message);
  } else {
    console.log("✅ Database connected");
  }
});

export default db;
