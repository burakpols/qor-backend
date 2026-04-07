const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  role: {
    type: String,
    enum: ["admin", "manager", "waiter", "customer"],
    default: "customer",
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Define model
const User = mongoose.model("User", userSchema, "users");

module.exports = User;
