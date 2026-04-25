require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const authRoutes = require("../server/routes/auth");
const dataRoutes = require("../server/routes/data");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:8080",
  credentials: true,
}));
app.use(express.json({ limit: "512kb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api", dataRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

let connectionPromise = null;
async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferTimeoutMS: 30000,
      maxPoolSize: 10,
    }).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  await connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await connectMongo();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    return res.status(500).json({ error: "DB connection failed", detail: err.message });
  }
  return app(req, res);
};
