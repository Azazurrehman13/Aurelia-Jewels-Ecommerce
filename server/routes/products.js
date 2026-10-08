import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// escape special characters so search text can't break the regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/*
  GET /api/products
  Optional query params:
    category=rings        material=gold
    search=royal          featured=true
    minPrice=10000        maxPrice=100000
    sort=price-asc | price-desc | newest (default)
    page=1                limit=12
*/
router.get("/", async (req, res) => {
  try {
    const { category, material, search, featured, minPrice, maxPrice } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (material) filter.material = material;
    if (featured === "true") filter.featured = true;
    if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortMap = {
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      newest: { createdAt: -1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.newest;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid product id" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products  (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id  (admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid product id" });

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id  (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid product id" });

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;