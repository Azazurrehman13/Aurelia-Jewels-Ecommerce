import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./models/Product.js";

dotenv.config();

// placeholder pictures: replace the links with your own photos later
const img = (text) =>
  `https://placehold.co/600x600/1c1f24/d4af37?text=${encodeURIComponent(text)}`;

const products = [
  // ---- Rings ----
  {
    name: "Royal Solitaire Ring",
    description: "Classic solitaire ring in 22K gold with a brilliant centre stone. Ideal for engagements.",
    category: "rings", material: "gold", purity: "22K", weightGrams: 6.5,
    price: 185000, stock: 8, featured: true, images: [img("Royal Solitaire Ring")],
  },
  {
    name: "Diamond Halo Ring",
    description: "Round diamond surrounded by a halo of smaller stones, set in white gold.",
    category: "rings", material: "diamond", purity: "18K", weightGrams: 4.2,
    price: 320000, stock: 4, featured: false, images: [img("Diamond Halo Ring")],
  },
  // ---- Necklaces ----
  {
    name: "Classic Gold Chain",
    description: "Timeless 22K gold chain, 20 inch, suitable for daily wear.",
    category: "necklaces", material: "gold", purity: "22K", weightGrams: 12,
    price: 310000, stock: 6, featured: true, images: [img("Classic Gold Chain")],
  },
  {
    name: "Pearl Drop Pendant",
    description: "Elegant pendant with a pearl drop on a fine silver chain.",
    category: "necklaces", material: "silver", purity: "925", weightGrams: 5.5,
    price: 22000, stock: 15, featured: false, images: [img("Pearl Drop Pendant")],
  },
  // ---- Earrings ----
  {
    name: "Jhumka Gold Earrings",
    description: "Traditional jhumka earrings in 22K gold with fine detailing.",
    category: "earrings", material: "gold", purity: "22K", weightGrams: 9,
    price: 245000, stock: 7, featured: true, images: [img("Jhumka Gold Earrings")],
  },
  {
    name: "Diamond Stud Earrings",
    description: "Simple and bright diamond studs for everyday elegance.",
    category: "earrings", material: "diamond", purity: "18K", weightGrams: 2.4,
    price: 150000, stock: 10, featured: false, images: [img("Diamond Stud Earrings")],
  },
  // ---- Bracelets ----
  {
    name: "Gold Charm Bracelet",
    description: "22K gold bracelet with delicate charms. A lovely gift.",
    category: "bracelets", material: "gold", purity: "22K", weightGrams: 10,
    price: 265000, stock: 5, featured: false, images: [img("Gold Charm Bracelet")],
  },
  {
    name: "Silver Link Bracelet",
    description: "Polished sterling silver link bracelet with a secure clasp.",
    category: "bracelets", material: "silver", purity: "925", weightGrams: 14,
    price: 18000, stock: 20, featured: false, images: [img("Silver Link Bracelet")],
  },
  // ---- Bangles ----
  {
    name: "Bridal Gold Bangles (Set of 4)",
    description: "Heavy 22K gold bangles, handcrafted for weddings.",
    category: "bangles", material: "gold", purity: "22K", weightGrams: 48,
    price: 1250000, stock: 3, featured: true, images: [img("Bridal Gold Bangles")],
  },
  {
    name: "Everyday Gold Kangan",
    description: "Light 21K gold kangan for daily and festive wear.",
    category: "bangles", material: "gold", purity: "21K", weightGrams: 16,
    price: 420000, stock: 9, featured: false, images: [img("Everyday Gold Kangan")],
  },
  // ---- Sets ----
  {
    name: "Bridal Necklace Set",
    description: "Complete bridal set: necklace, earrings and tikka in 22K gold.",
    category: "sets", material: "gold", purity: "22K", weightGrams: 65,
    price: 1800000, stock: 2, featured: true, images: [img("Bridal Necklace Set")],
  },
  {
    name: "Silver Party Set",
    description: "Silver necklace and earrings set with a modern design.",
    category: "sets", material: "silver", purity: "925", weightGrams: 28,
    price: 45000, stock: 12, featured: false, images: [img("Silver Party Set")],
  },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({}); // clears old products so you don't get duplicates
    await Product.insertMany(products);
    console.log(`Done: ${products.length} products added`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();