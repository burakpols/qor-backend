const mongoose = require("mongoose");

// Define schema
const menuSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  img: {
    type: String,
    default: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop",
  },
  discount: { type: Number, default: 0, min: 0, max: 100 }, // Discount percentage
  isAvailable: { type: Boolean, default: true },
  popularity: { type: Number, default: 0, min: 0 }, // Number of orders
  stock: { type: Number, default: 10, min: 0 }, // Stok miktarı
  lowStockThreshold: { type: Number, default: 5 }, // Kritik stok eşiği
  trackStock: { type: Boolean, default: true }, // Stok takibi açık mı?
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Define model
const Menu = mongoose.model("Menu", menuSchema, "menu");

module.exports = Menu;
