const mongoose = require("mongoose");

// Define schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: "" },
  tableNumber: { type: String, default: null },
  items: [
    {
      menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
      title: String,
      price: Number,
      quantity: { type: Number, required: true, min: 1 },
      discount: Number,
    },
  ],
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["pending", "confirmed", "prepared", "served", "cancelled"],
    default: "pending",
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Define model
const Order = mongoose.model("Order", orderSchema, "orders");

module.exports = Order;
