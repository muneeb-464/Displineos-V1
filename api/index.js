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

let connected = false;
async function connectMongo() {
  if (connected || mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  connected = true;
}

module.exports = async (req, res) => {
  await connectMongo();
  return app(req, res);
};
