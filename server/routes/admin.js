import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { notifyStatusChange } from "../utils/notify.js";

const router = express.Router();

// every route in this file needs a valid token AND the admin role
router.use(protect, adminOnly);

/* ---------------- image upload ---------------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const extFor = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${extFor[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 5 }, // 3 MB each, 5 per upload
  fileFilter: (req, file, cb) =>
    extFor[file.mimetype]
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG or WEBP images are allowed")),
});

// POST /api/admin/upload   (form field name: "images")
router.post("/upload", (req, res) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Each image must be under 3 MB" : err.message;
      return res.status(400).json({ message });
    }
    if (!req.files?.length)
      return res.status(400).json({ message: "No image received" });

    const base = `${req.protocol}://${req.get("host")}`;
    res.json({ urls: req.files.map((f) => `${base}/uploads/${f.filename}`) });
  });
});

/* ---------------- dashboard numbers ---------------- */
router.get("/stats", async (req, res) => {
  try {
    const [products, customers, orders, pending, sales, lowStock, recent] =
      await Promise.all([
        Product.countDocuments(),
        User.countDocuments({ role: "customer" }),
        Order.countDocuments(),
        Order.countDocuments({ status: "pending" }),
        Order.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Product.find({ stock: { $lte: 3 } })
          .sort({ stock: 1 })
          .limit(8)
          .select("name stock category"),
        Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
      ]);

    res.json({
      products,
      customers,
      orders,
      pending,
      sales: sales[0]?.total || 0,
      lowStock,
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- orders ---------------- */
// GET /api/admin/orders?status=pending&page=1
router.get("/orders", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email"),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// which status changes are allowed
const allowed = {
  pending: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// PUT /api/admin/orders/:id/status
router.put("/orders/:id/status", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid order id" });

    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!allowed[order.status]?.includes(status))
      return res.status(400).json({
        message: `A ${order.status} order cannot be changed to ${status}`,
      });

    // cancelled orders give their stock back
    if (status === "cancelled") {
      await Promise.all(
        order.items.map((i) =>
          Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })
        )
      );
    }

    order.status = status;
    await order.save();
    await order.populate("user", "name email");

    res.json(order);

    // email the customer at the address they registered with
    notifyStatusChange(order, order.user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- customers ---------------- */
router.get("/customers", async (req, res) => {
  try {
    const [users, totals] = await Promise.all([
      User.find({ role: "customer" }).sort({ createdAt: -1 }).select("-password"),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$total" } } },
      ]),
    ]);

    const byUser = new Map(totals.map((t) => [String(t._id), t]));
    res.json(
      users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        orders: byUser.get(String(u._id))?.orders || 0,
        spent: byUser.get(String(u._id))?.spent || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- stock / inventory ---------------- */
const stockFields = "name category material purity price stock images featured updatedAt";

// GET /api/admin/inventory   (every product with its stock)
router.get("/inventory", async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 }).select(stockFields);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/inventory/:id   body: { "stock": 12 }
router.put("/inventory/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid product id" });

    const stock = Number(req.body.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000)
      return res.status(400).json({ message: "Stock must be a whole number, 0 or more" });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    ).select(stockFields);

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;