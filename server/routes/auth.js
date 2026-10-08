import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { validatePassword, isValidEmail } from "../utils/validators.js";
import { notifyPasswordReset, notifyPasswordChanged } from "../utils/notify.js";

const router = express.Router();

const RESET_MINUTES = 30; // how long a reset link works

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const userData = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
});

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// finds the user a reset link belongs to (only if it has not expired)
const findByResetToken = (token) =>
  User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });

// POST /api/auth/signup  (always creates a customer, never an admin)
router.post("/signup", async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = (req.body.email || "").trim().toLowerCase();

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!isValidEmail(email))
      return res.status(400).json({ message: "Enter a valid email address" });

    const missing = validatePassword(password);
    if (missing.length > 0)
      return res.status(400).json({
        message: `Password needs: ${missing.join(", ")}`,
      });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    // role is NOT taken from the request, so nobody can sign up as admin
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: makeToken(user._id), user: userData(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    if (!isValidEmail(email))
      return res.status(400).json({ message: "Enter a valid email address" });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Wrong email or password" });

    res.json({ token: makeToken(user._id), user: userData(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/admin-login  (only the admin account is accepted)
router.post("/admin-login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });

    // same message for "no such user", "wrong password" and "not an admin"
    if (!user || user.role !== "admin" || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Wrong admin email or password" });

    res.json({ token: makeToken(user._id), user: userData(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- forgot / reset password ---------------- */

// POST /api/auth/forgot-password   body: { email }
router.post("/forgot-password", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!isValidEmail(email))
      return res.status(400).json({ message: "Enter a valid email address" });

    const user = await User.findOne({ email }).select("+resetPasswordExpires");

    if (user) {
      // one reset email per minute per account (a fresh link was just sent)
      const justSent =
        user.resetPasswordExpires &&
        user.resetPasswordExpires.getTime() > Date.now() + (RESET_MINUTES - 1) * 60 * 1000;

      if (!justSent) {
        const token = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = hashToken(token); // only the hash is stored
        user.resetPasswordExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
        await user.save();

        notifyPasswordReset(user, token, RESET_MINUTES); // email, runs in the background
      }
    }

    // same answer whether or not the email exists
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/reset-password/:token   (is this link still valid?)
router.get("/reset-password/:token", async (req, res) => {
  try {
    const user = await findByResetToken(req.params.token);
    if (!user)
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password/:token   body: { password }
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    const missing = validatePassword(password || "");
    if (missing.length > 0)
      return res.status(400).json({ message: `Password needs: ${missing.join(", ")}` });

    const user = await findByResetToken(req.params.token);
    if (!user)
      return res.status(400).json({ message: "This reset link is invalid or has expired" });

    if (await user.matchPassword(password))
      return res.status(400).json({ message: "Please choose a different password from your old one" });

    user.password = password; // hashed automatically by the model
    user.resetPasswordToken = undefined; // the link can be used only once
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated. You can now log in." });
    notifyPasswordChanged(user); // confirmation email
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- account ---------------- */

// GET /api/auth/me  (needs token)
router.get("/me", protect, (req, res) => res.json(req.user));

// PUT /api/auth/profile  (change display name)
router.put("/profile", protect, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();

    if (!name) return res.status(400).json({ message: "Name cannot be empty" });
    if (name.length > 60)
      return res.status(400).json({ message: "Name is too long (60 characters max)" });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true }
    ).select("-password");

    res.json(userData(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/password  (change password while logged in)
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Please fill in both password fields" });

    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: "Your current password is incorrect" });

    const missing = validatePassword(newPassword);
    if (missing.length > 0)
      return res.status(400).json({
        message: `New password needs: ${missing.join(", ")}`,
      });

    if (currentPassword === newPassword)
      return res.status(400).json({
        message: "New password must be different from your current one",
      });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;