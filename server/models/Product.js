import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    description: { type: String, trim: true, default: "" },
    category: {
      type: String,
      required: true,
      enum: ["rings", "necklaces", "earrings", "bracelets", "bangles", "sets"],
    },
    material: {
      type: String,
      enum: ["gold", "silver", "diamond", "platinum", "artificial"],
      default: "gold",
    },
    purity: { type: String, default: "" },        // e.g. "22K", "24K", "925"
    weightGrams: { type: Number, min: 0, default: 0 },
    price: { type: Number, required: true, min: [0, "Price cannot be negative"] }, // in PKR
    images: { type: [String], default: [] },       // image links for now
    stock: { type: Number, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// speeds up filtering by category and searching by name
productSchema.index({ category: 1, price: 1 });
productSchema.index({ name: "text" });

export default mongoose.model("Product", productSchema);