// server.js (pakai ESM)
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import hotspotRoutes from "./routes/hotspot.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:5173", // alamat frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // kalau mau kirim cookies
}));
app.use(bodyParser.json());
app.use("/auth", authRoutes);
app.use("/hotspot", hotspotRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
