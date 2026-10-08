import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import { validatePassword, isValidEmail } from "./utils/validators.js";

dotenv.config();

const run = async () => {
  try {
    const name = (process.env.ADMIN_NAME || "Store Admin").trim();
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";

    if (!isValidEmail(email)) throw new Error("Put a valid ADMIN_EMAIL in .env");
    const missing = validatePassword(password);
    if (missing.length) throw new Error(`ADMIN_PASSWORD needs: ${missing.join(", ")}`);

    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log(`An admin already exists (${existing.email}). Only one admin is allowed.`);
      return;
    }

    const user = await User.findOne({ email });
    if (user) {
      // an account with this email exists, so promote it and set the admin password
      user.role = "admin";
      user.password = password;
      await user.save();
      console.log(`${email} is now the admin`);
    } else {
      await User.create({ name, email, password, role: "admin" });
      console.log(`Admin created: ${email}`);
    }
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();