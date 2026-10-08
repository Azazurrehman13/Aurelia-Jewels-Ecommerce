import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";
import { notifyOrderPlaced, notifyCustomerCancelled } from "../utils/notify.js";

const router = express.Router();

const FREE_DELIVERY_OVER = 100000; // Rs
const DELIVERY_FEE = 500;          // Rs
const phoneRegex = /^(\+92|0)3\d{9}$/; // 03001234567 or +923001234567

// put stock back (used when an order fails or is cancelled)
const restoreStock = (list) =>
  Promise.all(
    list.map(({ id, qty }) => Product.updateOne({ _id: id }, { $inc: { stock: qty } }))
  );

// POST /api/orders   (logged-in users)
router.post("/", protect, async (req, res) => {
  const reserved = [];
  try {
    const { items, shippingAddress, paymentMethod = "cod" } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Your cart is empty" });

    if (paymentMethod !== "cod")
      return res.status(400).json({ message: "Only Cash on Delivery is available right now" });

    const fullName = (shippingAddress?.fullName || "").trim();
    const address = (shippingAddress?.address || "").trim();
    const city = (shippingAddress?.city || "").trim();
    const note = (shippingAddress?.note || "").trim();
    const phone = (shippingAddress?.phone || "").replace(/[\s-]/g, "");

    if (!fullName || !address || !city || !phone)
      return res.status(400).json({ message: "Please fill in all delivery details" });
    if (!phoneRegex.test(phone))
      return res.status(400).json({ message: "Enter a valid mobile number, e.g. 03001234567" });

    // combine duplicate products and check the ids and quantities
    const wanted = new Map();
    for (const it of items) {
      const qty = Math.floor(Number(it.qty));
      if (!mongoose.isValidObjectId(it.productId) || !qty || qty < 1)
        return res.status(400).json({ message: "Invalid item in cart" });
      const key = String(it.productId);
      wanted.set(key, (wanted.get(key) || 0) + qty);
    }

    // prices come from the database, never from the browser
    const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
    if (products.length !== wanted.size)
      return res.status(400).json({ message: "A product in your cart is no longer available" });

    const orderItems = [];
    for (const p of products) {
      const qty = wanted.get(String(p._id));

      // take the stock in one atomic step, only if enough is left
      const updated = await Product.findOneAndUpdate(
        { _id: p._id, stock: { $gte: qty } },
        { $inc: { stock: -qty } }
      );
      if (!updated) {
        await restoreStock(reserved);
        return res.status(400).json({
          message: `Not enough stock for "${p.name}". Please update your cart.`,
        });
      }
      reserved.push({ id: p._id, qty });

      orderItems.push({
        product: p._id,
        name: p.name,
        price: p.price,
        qty,
        image: p.images?.[0] || "",
      });
    }

    const itemsTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryFee = itemsTotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      itemsTotal,
      deliveryFee,
      total: itemsTotal + deliveryFee,
      shippingAddress: { fullName, phone, address, city, note },
      paymentMethod: "cod",
    });

    res.status(201).json(order);

    // emails: customer confirmation + admin alert (runs in the background)
    notifyOrderPlaced(order, req.user);
  } catch (err) {
    await restoreStock(reserved); // order was not saved, so give the stock back
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/mine   (my orders, newest first)
router.get("/mine", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id   (the owner, or an admin)
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid order id" });

    const order = await Order.findById(req.params.id);
    const allowed =
      order && (String(order.user) === String(req.user._id) || req.user.role === "admin");
    if (!allowed) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/cancel   (owner, only while pending)
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid order id" });

    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "pending")
      return res.status(400).json({ message: "Only pending orders can be cancelled" });

    order.status = "cancelled";
    await order.save();
    await restoreStock(order.items.map((i) => ({ id: i.product, qty: i.qty })));

    res.json(order);

    // emails: customer confirmation + admin alert
    notifyCustomerCancelled(order, req.user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;