import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// CLIENT_URL can hold several addresses separated by commas
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""));

const isDev = process.env.NODE_ENV !== "production";
const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin: (origin, cb) => {
      // no origin = tools like curl or PowerShell
      if (!origin || allowedOrigins.includes(origin) || (isDev && localhostPattern.test(origin)))
        return cb(null, true);
      cb(new Error(`Blocked by CORS: ${origin}`));
    },
  })
);
app.use(express.json());

// uploaded product photos
app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`API running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("DB connection failed:", err.message));