// Import the required modules
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const Menu = require("./models/Menu");
const Order = require("./models/Order");
const User = require("./models/User");
const aiService = require("./aiService");

// ==================== SETTINGS SCHEMA ====================
const settingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: "akay Restaurant" },
  phone: { type: String, default: "+90 (212) 555-1234" },
  address: { type: String, default: "İstanbul, Türkiye" },
  businessHours: {
    isEnabled: { type: Boolean, default: false }, // false: 7/24 mod, true: saat aralığı modu
    is247: { type: Boolean, default: true },       // true: her zaman açık, false: her zaman kapalı (isEnabled=false iken)
    open: { type: String, default: "09:00" },
    close: { type: String, default: "23:00" },
    timezone: { type: String, default: "Europe/Istanbul" },
  },
  minimumOrder: { type: Number, default: 25, min: 0 },
  currency: { type: String, default: "₺", enum: ["₺", "$", "€"] },
  globalDiscount: { type: Number, default: 0, min: 0, max: 100 },
  notifications: {
    newOrder: { type: Boolean, default: true },
    statusChange: { type: Boolean, default: true },
    lowInventory: { type: Boolean, default: false },
  },
  theme: { type: String, default: "light", enum: ["light", "dark"] },
  tableSettings: {
    totalTables: { type: Number, default: 20, min: 1 },
    inactiveTables: [{ type: Number }],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Settings = mongoose.model("Settings", settingsSchema, "settings");

// Environment variables - Railway deployment için
// ÖNEMLİ: MONGO_URI ve JWT_SECRET Railway Environment Variables'da ayarlanmalı!
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3800;
const NODE_ENV = process.env.NODE_ENV || "production";

// Bağlantı kontrolü
if (!MONGO_URI) {
  console.error("❌ HATA: MONGO_URI environment variable ayarlanmamış!");
  console.error("   Railway'de Environment Variables bölümünde MONGO_URI ayarlayın.");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("❌ HATA: JWT_SECRET environment variable ayarlanmamış!");
  console.error("   Railway'de Environment Variables bölümünde JWT_SECRET ayarlayın.");
  process.exit(1);
}

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "public", "images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB default
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✓ Connected to MongoDB");
  })
  .catch((error) => {
    console.error("✗ Error connecting to MongoDB:", error.message);
  });

// Express app setup
const app = express();
app.use(express.static("public"));

// CORS configuration - Tüm origin'lere izin ver (debug için)
app.use(
  cors({
    origin: true, // Tüm origin'lere izin ver - Railway production için gerekli
    credentials: true,
  })
);

// Debug: Tüm istekleri logla
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} from ${req.headers.origin}`);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// ==================== AUTHENTICATION MIDDLEWARE ====================

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Failed to authenticate token" });
    }
    req.user = decoded;
    next();
  });
};

// Middleware to check role-based access
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // superadmin can access everything
    if (req.user.role === "superadmin") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
    }

    next();
  };
};

// ==================== AUTH ENDPOINTS ====================

// User login (for staff: admin, manager, waiter)
app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "User account is deactivated" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Error during login" });
  }
});

// Generate QR token for customers (one-time token, 1 hour validity)
app.get("/api/v1/auth/qr-token", (req, res) => {
  try {
    // Generate temporary token for QR menu access
    const qrToken = jwt.sign(
      { type: "qr_customer", role: "customer" },
      JWT_SECRET,
      { expiresIn: process.env.QR_TOKEN_EXPIRE || 3600 } // 1 hour
    );

    res.json({
      token: qrToken,
      expiresIn: parseInt(process.env.QR_TOKEN_EXPIRE) || 3600,
    });
  } catch (error) {
    console.error("QR token generation error:", error.message);
    res.status(500).json({ message: "Error generating QR token" });
  }
});

// Create new user (admin only)
app.post("/api/v1/auth/register", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // admin cannot create superadmin
    if (req.user.role === "admin" && role === "superadmin") {
      return res.status(403).json({ message: "Admins cannot create superadmins" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({
      username,
      password,
      email,
      role: role || "waiter",
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("User registration error:", error.message);
    res.status(500).json({ message: "Error creating user" });
  }
});

// ==================== USER MANAGEMENT ENDPOINTS ====================

// Get all users (admin only)
app.get("/api/v1/users", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get single user (admin only)
app.get("/api/v1/users/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// Update user (admin only)
app.put("/api/v1/users/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // superadmin protection
    if (targetUser.role === "superadmin") {
      if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Cannot modify superadmin" });
      }
      // superadmin role cannot be changed
      if (role && role !== "superadmin") {
        return res.status(403).json({ message: "Cannot remove superadmin role" });
      }
    }

    // admin protection
    if (req.user.role === "admin" && role === "superadmin") {
      return res.status(403).json({ message: "Admins cannot promote to superadmin" });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = Date.now();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Error updating user" });
  }
});

// Delete user (admin only)
app.delete("/api/v1/users/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // self protection
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    // superadmin protection
    if (targetUser.role === "superadmin") {
      return res.status(403).json({ message: "Superadmin cannot be deleted" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully", userId: req.params.id });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// Toggle user active status (admin only)
app.post("/api/v1/users/:id/toggle-active", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // self protection
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: "Cannot deactivate yourself" });
    }

    // superadmin protection
    if (targetUser.role === "superadmin") {
      return res.status(403).json({ message: "Superadmin cannot be deactivated" });
    }

    targetUser.isActive = !targetUser.isActive;
    targetUser.updatedAt = Date.now();
    await targetUser.save();

    res.json({ 
      message: targetUser.isActive ? "User activated" : "User deactivated",
      user: { id: targetUser._id, username: targetUser.username, isActive: targetUser.isActive }
    });
  } catch (error) {
    console.error("Error toggling user status:", error.message);
    res.status(500).json({ message: "Error toggling user status" });
  }
});

// ==================== MENU ENDPOINTS ====================

// Get all items
app.get("/api/v1/items", async (req, res) => {
  try {
    const items = await Menu.find({}).sort({ category: 1 });
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error.message);
    res.status(500).json({ message: "Error fetching items" });
  }
});

// Get items by category
app.get("/api/v1/items/category/:category", async (req, res) => {
  try {
    const items = await Menu.find({ category: req.params.category });
    res.json(items);
  } catch (error) {
    console.error("Error fetching items by category:", error.message);
    res.status(500).json({ message: "Error fetching items" });
  }
});

// Get single item
app.get("/api/v1/items/:id", async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ message: "Error fetching item" });
  }
});

// Add item (manager, admin only)
app.post("/api/v1/items", verifyToken, checkRole(["admin", "manager"]), async (req, res) => {
  try {
    const { category, subcategory, title, desc, price, img, discount, isAvailable } = req.body;

    if (!category || !subcategory || !title || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newItem = new Menu({
      id: new mongoose.Types.ObjectId(),
      category,
      subcategory,
      title,
      desc,
      price: parseFloat(price),
      img: img || undefined, // Use default if not provided
      discount: discount || 0,
      isAvailable: isAvailable !== false,
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error adding item:", error.message);
    res.status(500).json({ message: "Error adding item" });
  }
});

// Update item (manager, admin only)
app.put("/api/v1/items/:id", verifyToken, checkRole(["admin", "manager"]), async (req, res) => {
  try {
    const { category, subcategory, title, desc, price, img, discount, isAvailable, popularity, stock, lowStockThreshold, trackStock } = req.body;

    const updateData = {};
    if (category) updateData.category = category;
    if (subcategory) updateData.subcategory = subcategory;
    if (title) updateData.title = title;
    if (desc) updateData.desc = desc;
    if (price) updateData.price = parseFloat(price);
    if (img) updateData.img = img;
    if (discount !== undefined) updateData.discount = discount;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (popularity !== undefined) updateData.popularity = popularity;
    if (stock !== undefined) updateData.stock = stock;
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
    if (trackStock !== undefined) updateData.trackStock = trackStock;

    updateData.updatedAt = Date.now();

    const updatedItem = await Menu.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error.message);
    res.status(500).json({ message: "Error updating item" });
  }
});

// Delete item (admin only)
app.delete("/api/v1/items/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const deletedItem = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully", item: deletedItem });
  } catch (error) {
    console.error("Error deleting item:", error.message);
    res.status(500).json({ message: "Error deleting item" });
  }
});

// ==================== IMAGE UPLOAD ENDPOINT ====================

// Upload image
app.post("/api/v1/upload", verifyToken, checkRole(["admin", "manager"]), upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Return relative path for storing in database
    const imagePath = `/images/${req.file.filename}`;
    res.status(201).json({
      message: "Image uploaded successfully",
      filename: req.file.filename,
      path: imagePath,
      url: `${req.protocol}://${req.get("host")}${imagePath}`,
    });
  } catch (error) {
    console.error("Image upload error:", error.message);
    res.status(500).json({ message: "Error uploading image" });
  }
});

// ==================== ORDER ENDPOINTS ====================

// Create new order
app.post("/api/v1/orders", async (req, res) => {
  try {
    const { items, total, notes, customerName, customerEmail, tableNumber } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: "Müşteri adı gerekli" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "En az bir ürün seçilmeli" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: "Geçerli bir toplam türü gerekli" });
    }

    // ⬇️ STOK KONTROLÜ - Sipariş vermeden ÖNCE stok yeterliliğini kontrol et
    const stockErrors = [];
    for (const orderItem of items) {
      if (orderItem.menuItemId) {
        const menuItem = await Menu.findById(orderItem.menuItemId);
        if (menuItem && menuItem.trackStock) {
          const currentStock = menuItem.stock || 0;
          const requestedQuantity = orderItem.quantity || 1;
          if (currentStock < requestedQuantity) {
            stockErrors.push({
              title: menuItem.title,
              requested: requestedQuantity,
              available: currentStock
            });
          }
        }
      }
    }

    // Eğer stok hatası varsa siparişi engelle
    if (stockErrors.length > 0) {
      return res.status(400).json({
        message: "Yetersiz stok!",
        stockErrors: stockErrors
      });
    }

    const newOrder = new Order({
      userId: req.user?.userId || null,
      customerName,
      customerEmail: customerEmail || "",
      tableNumber: tableNumber || null,
      items,
      total,
      notes: notes || "",
      status: "pending",
    });

    await newOrder.save();

    // Stok azaltma işlemi (sipariş verildiğinde)
    const lowStockItems = [];
    for (const orderItem of items) {
      if (orderItem.menuItemId) {
        const menuItem = await Menu.findById(orderItem.menuItemId);
        if (menuItem && menuItem.trackStock) {
          const newStock = Math.max(0, (menuItem.stock || 0) - (orderItem.quantity || 1));
          const wasLowStock = menuItem.stock <= menuItem.lowStockThreshold;
          const isNowLowStock = newStock <= menuItem.lowStockThreshold;
          
          await Menu.findByIdAndUpdate(orderItem.menuItemId, { 
            stock: newStock,
            isAvailable: newStock > 0
          });
          
          // Düşük stok uyarısı
          if (!wasLowStock && isNowLowStock) {
            lowStockItems.push({
              title: menuItem.title,
              stock: newStock,
              threshold: menuItem.lowStockThreshold
            });
          }
        }
      }
    }
    
    if (lowStockItems.length > 0) {
      console.log("⚠️ Düşük stok uyarısı:", lowStockItems);
    }

    res.status(201).json({ 
      ...newOrder.toObject(),
      lowStockAlert: lowStockItems.length > 0 ? lowStockItems : undefined
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ message: "Sipariş oluşturulamadı" });
  }
});

// Get all orders (admin, manager, waiter only)
app.get("/api/v1/orders", verifyToken, checkRole(["admin", "manager", "waiter"]), async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "username email")
      .populate("items.menuItemId", "title price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Get user's orders
app.get("/api/v1/my-orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate("items.menuItemId", "title price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error.message);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Get single order
app.get("/api/v1/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "username email")
      .populate("items.menuItemId", "title price");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    res.status(500).json({ message: "Error fetching order" });
  }
});

// Update order status (manager, waiter, admin only)
app.put("/api/v1/orders/:id", verifyToken, checkRole(["admin", "manager", "waiter"]), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "prepared", "served", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get the current order to check if we're transitioning TO served
    const currentOrder = await Order.findById(req.params.id);
    const isTransitioningToServed = currentOrder.status !== "served" && status === "served";

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status, updatedAt: Date.now() } },
      { new: true }
    ).populate("userId", "username").populate("items.menuItemId", "title price");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Increment menu item popularity if transitioning to served
    if (isTransitioningToServed) {
      for (const item of updatedOrder.items) {
        await Menu.findByIdAndUpdate(
          item.menuItemId._id,
          { $inc: { popularity: item.quantity } },
          { new: true }
        );
      }
      console.log(`✓ Updated popularity for ${updatedOrder.items.length} items`);
    }

    // ⬇️ STOK İADESİ - Sipariş iptal edildiğinde stoğu geri ekle
    const isTransitioningToCancelled = currentOrder.status !== "cancelled" && status === "cancelled";
    if (isTransitioningToCancelled) {
      for (const item of currentOrder.items) {
        if (item.menuItemId) {
          const menuItem = await Menu.findById(item.menuItemId);
          if (menuItem && menuItem.trackStock) {
            const newStock = (menuItem.stock || 0) + (item.quantity || 1);
            await Menu.findByIdAndUpdate(item.menuItemId, { 
              stock: newStock,
              isAvailable: true // İptal edilince ürünü tekrar mevcut yap
            });
            console.log(`✓ Stok iade edildi: ${menuItem.title} (+${item.quantity})`);
          }
        }
      }
      console.log(`✓ Sipariş iptal edildi, stoklar geri eklendi`);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ message: "Error updating order" });
  }
});

// Helper function to calculate analytics data
async function calculateAnalytics() {
  const orders = await Order.find({}).populate("items.menuItemId", "title price category");
  const items = await Menu.find({});

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "served").length;
  const pendingOrders = orders.filter((o) => o.status !== "served" && o.status !== "cancelled").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const totalRevenue = orders.filter((o) => o.status === "served").reduce((sum, o) => sum + (o.total || 0), 0);

  const mostOrderedItems = items
    .map((item) => ({ title: item.title, count: item.popularity || 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const ordersByTableObj = {};
  orders.forEach((order) => {
    if (order.tableNumber) {
      const key = `Masa ${order.tableNumber}`;
      ordersByTableObj[key] = (ordersByTableObj[key] || 0) + 1;
    }
  });
  const ordersByTable = Object.entries(ordersByTableObj).map(([table, count]) => ({ table, count }));

  const ordersByStatus = {
    "Beklemede": orders.filter((o) => o.status === "pending").length,
    "Onaylandı": orders.filter((o) => o.status === "confirmed").length,
    "Hazırlandı": orders.filter((o) => o.status === "prepared").length,
    "Servis Edildi": orders.filter((o) => o.status === "served").length,
    "İptal Edildi": orders.filter((o) => o.status === "cancelled").length,
  };

  const dailyRevenueObj = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("tr-TR");
    dailyRevenueObj[dateStr] = 0;
  }

  orders.forEach((order) => {
    if (order.status === "served") {
      const dateStr = new Date(order.createdAt).toLocaleDateString("tr-TR");
      if (dailyRevenueObj[dateStr] !== undefined) {
        dailyRevenueObj[dateStr] += order.total || 0;
      }
    }
  });
  const dailyRevenue = Object.entries(dailyRevenueObj).map(([date, revenue]) => ({ date, revenue }));

  const hourlyOrdersObj = {};
  for (let i = 0; i < 24; i++) {
    hourlyOrdersObj[i] = 0;
  }
  orders.filter((o) => o.status === "served").forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    hourlyOrdersObj[hour]++;
  });
  const hourlyOrders = Object.entries(hourlyOrdersObj).map(([hour, count]) => ({ hour: parseInt(hour), count }));

  const categoryStats = {};
  orders.filter((o) => o.status === "served").forEach((order) => {
    order.items?.forEach((item) => {
      if (item.menuItemId?.category) {
        const cat = item.menuItemId.category;
        categoryStats[cat] = (categoryStats[cat] || 0) + item.quantity;
      }
    });
  });

  const lowestPerformingItems = items
    .map((item) => ({ title: item.title, count: item.popularity || 0 }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0;
  const cancelRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(2) : 0;
  const averageOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayRevenue = orders
    .filter((o) => o.status === "served" && new Date(o.createdAt) >= today)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const yesterdayRevenue = orders
    .filter((o) => o.status === "served" && 
      new Date(o.createdAt) >= yesterday && 
      new Date(o.createdAt) < today)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueChange = yesterdayRevenue > 0 
    ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2)
    : 0;

  const totalTables = 20;
  const usedTables = Object.keys(ordersByTable).length;
  const tableUtilization = ((usedTables / totalTables) * 100).toFixed(2);

  const combinations = {};
  orders.filter((o) => o.status === "served").forEach((order) => {
    const itemTitles = order.items?.map(i => i.title).sort().join(" + ");
    if (itemTitles) {
      combinations[itemTitles] = (combinations[itemTitles] || 0) + 1;
    }
  });
  const productCombinations = Object.entries(combinations)
    .map(([combo, count]) => ({ combo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const uniqueCustomers = new Set(orders.map((o) => o.customerName)).size;
  const repeatOrders = orders.filter((o) => {
    const count = orders.filter((x) => x.customerName === o.customerName).length;
    return count > 1;
  }).length;
  const repeatCustomerRate = uniqueCustomers > 0 ? ((repeatOrders / (uniqueCustomers * 2)) * 100).toFixed(2) : 0;

  const peakHours = Object.entries(hourlyOrders)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((h) => `${h.hour}:00 (${h.count} sipariş)`);

  const categoryPerformance = {};
  orders.filter((o) => o.status === "served").forEach((order) => {
    order.items?.forEach((item) => {
      const cat = item.menuItemId?.category || "Diğer";
      if (!categoryPerformance[cat]) {
        categoryPerformance[cat] = { totalRevenue: 0, orderCount: 0 };
      }
      categoryPerformance[cat].totalRevenue += (item.price * item.quantity) || 0;
      categoryPerformance[cat].orderCount += 1;
    });
  });
  const categoryPerformanceData = Object.entries(categoryPerformance)
    .map(([cat, data]) => ({
      category: cat,
      avgValue: (data.totalRevenue / data.orderCount).toFixed(2),
      totalRevenue: data.totalRevenue.toFixed(2),
    }))
    .sort((a, b) => b.avgValue - a.avgValue);

  const currentDate = new Date();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(weekStart.getDate() - 7);
  const previousWeekEnd = new Date(weekEnd);
  previousWeekEnd.setDate(weekEnd.getDate() - 7);

  const thisWeekOrders = orders.filter(
    (o) => o.status === "served" && 
      new Date(o.createdAt) >= weekStart && 
      new Date(o.createdAt) <= weekEnd
  );
  const lastWeekOrders = orders.filter(
    (o) => o.status === "served" && 
      new Date(o.createdAt) >= previousWeekStart && 
      new Date(o.createdAt) <= previousWeekEnd
  );

  const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const weeklyChangePercent = lastWeekRevenue > 0 
    ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(2)
    : 0;

  const weeklyComparison = {
    thisWeek: { orders: thisWeekOrders.length, revenue: thisWeekRevenue.toFixed(2) },
    lastWeek: { orders: lastWeekOrders.length, revenue: lastWeekRevenue.toFixed(2) },
    changePercent: weeklyChangePercent,
  };

  const allDailyRevenues = Object.values(dailyRevenue).filter((r) => r > 0);
  const dailyAverage = allDailyRevenues.length > 0 
    ? (allDailyRevenues.reduce((sum, r) => sum + r, 0) / allDailyRevenues.length).toFixed(2)
    : 0;

  const targetVsActual = {
    target: dailyAverage,
    actual: todayRevenue.toFixed(2),
    percentage: dailyAverage > 0 ? ((todayRevenue / dailyAverage) * 100).toFixed(2) : 0,
  };

  const prepTimes = orders
    .filter((o) => o.status === "served" && o.createdAt && o.updatedAt)
    .map((o) => (new Date(o.updatedAt) - new Date(o.createdAt)) / 60000);
  const avgPrepTime = prepTimes.length > 0 
    ? (prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length).toFixed(2)
    : 0;

  return {
    summary: {
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue: totalRevenue.toFixed(2),
      completionRate,
      cancelRate,
      averageOrderValue,
      tableUtilization,
      repeatCustomerRate,
      avgPrepTime,
    },
    mostOrderedItems,
    lowestPerformingItems,
    ordersByStatus,
    dailyRevenue,
    hourlyOrders,
    categoryStats,
    productCombinations,
    peakHours,
    categoryPerformanceData,
    weeklyComparison,
    targetVsActual,
    revenueChange,
  };
}

// Get analytics data
app.get("/api/v1/analytics", verifyToken, checkRole(["admin", "manager", "waiter"]), async (req, res) => {
  try {
    const data = await calculateAnalytics();
    res.json(data);
  } catch (error) {
    console.error("Error fetching analytics:", error.message);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

// ==================== AI ADMIN CHAT ENDPOINT ====================

app.post("/api/v1/ai/admin-chat", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Gather full restaurant context
    const menu = await Menu.find({});
    const users = await User.find({}).select("-password");
    const analytics = await calculateAnalytics();

    const context = {
      menu,
      users,
      analytics
    };

    const response = await aiService.getAdminChatResponse(message, context, history || []);
    res.json({ response });
  } catch (error) {
    console.error("Admin AI Chat Error:", error);
    res.status(500).json({ message: "Error in admin AI chat" });
  }
});

// ==================== SETTINGS ENDPOINTS ====================

// Get settings (public)
app.get("/api/v1/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error.message);
    res.status(500).json({ message: "Error fetching settings" });
  }
});

// Update settings (admin only)
app.put("/api/v1/settings", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const updates = req.body;
    let settings = await Settings.findOne({});
    
    if (!settings) {
      settings = await Settings.create(updates);
    } else {
      Object.assign(settings, updates);
      settings.updatedAt = new Date();
      await settings.save();
    }
    
    console.log("✓ Settings updated");
    res.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error.message);
    res.status(500).json({ message: "Error updating settings" });
  }
});

// Toggle table active/inactive
app.post("/api/v1/settings/toggle-table/:tableNumber", verifyToken, checkRole(["admin", "manager"]), async (req, res) => {
  try {
    const { tableNumber } = req.params;
    let settings = await Settings.findOne({});
    
    if (!settings) {
      settings = await Settings.create({});
    }
    
    const tableNum = parseInt(tableNumber);
    const index = settings.tableSettings.inactiveTables.indexOf(tableNum);
    
    if (index > -1) {
      settings.tableSettings.inactiveTables.splice(index, 1);
    } else {
      settings.tableSettings.inactiveTables.push(tableNum);
    }
    
    await settings.save();
    console.log(`✓ Table ${tableNum} toggled. Inactive: ${settings.tableSettings.inactiveTables}`);
    res.json(settings);
  } catch (error) {
    console.error("Error toggling table:", error.message);
    res.status(500).json({ message: "Error toggling table" });
  }
});

// ==================== AI CHAT ENDPOINTS ====================

// Chat with AI about menu (public endpoint)
app.post("/api/v1/ai/chat", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check if GROQ_API_KEY is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ 
        message: "AI service is not configured. Please contact the administrator.",
        error: "GROQ_API_KEY not found"
      });
    }

    const response = await aiService.getMenuChatResponse(message, conversationHistory || []);
    res.json({ response });
  } catch (error) {
    console.error("AI Chat Error:", error.message);
    res.status(500).json({ message: error.message || "Error generating AI response" });
  }
});

// Chat with AI with menu context (public endpoint) - NOW WITH REAL ORDER ANALYTICS
app.post("/api/v1/ai/menu-chat", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check if GROQ_API_KEY is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ 
        message: "AI service is not configured. Please contact the administrator.",
        error: "GROQ_API_KEY not found"
      });
    }

    // Get all menu items with popularity for AI context
    const menuItems = await Menu.find({}).select("title category subcategory price discount isAvailable popularity");
    
    // Calculate order analytics for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentOrders = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
      status: { $in: ['pending', 'preparing', 'ready', 'served'] }
    }).populate("items.menuItemId", "title category");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate analytics
    const periodStats = {
      totalOrders: recentOrders.length,
      totalItemsSold: recentOrders.reduce((sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0), 0),
      totalRevenue: recentOrders.filter(o => o.status === 'served').reduce((sum, order) => sum + (order.total || 0), 0)
    };
    
    // Today's top items
    const todayOrders = recentOrders.filter(o => new Date(o.createdAt) >= today);
    const todayItemCounts = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.menuItemId) {
          const title = item.menuItemId.title;
          todayItemCounts[title] = (todayItemCounts[title] || 0) + item.quantity;
        }
      });
    });
    const todayTopItems = Object.entries(todayItemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, orderCount]) => ({ title, orderCount }));
    
    // Week's top items by category
    const weekItemCounts = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.menuItemId) {
          const key = item.menuItemId._id.toString();
          if (!weekItemCounts[key]) {
            weekItemCounts[key] = { 
              _id: item.menuItemId._id, 
              title: item.menuItemId.title, 
              category: item.menuItemId.category,
              orderCount: 0 
            };
          }
          weekItemCounts[key].orderCount += item.quantity;
        }
      });
    });
    
    const allWeekItems = Object.values(weekItemCounts);
    const weekTopItems = allWeekItems
      .filter(item => item.category !== 'İçecekler' && item.category !== 'İçecekler' && item.category !== 'Drinks')
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
    const weekTopDrinks = allWeekItems
      .filter(item => item.category === 'İçecekler' || item.category === 'İçecekler' || item.category === 'Drinks')
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
    
    // Category stats
    const categoryStats = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.menuItemId) {
          const cat = item.menuItemId.category || 'Diğer';
          if (!categoryStats[cat]) {
            categoryStats[cat] = { category: cat, orderCount: 0, revenue: 0 };
          }
          categoryStats[cat].orderCount += item.quantity;
          if (order.status === 'served') {
            categoryStats[cat].revenue += (item.price || 0) * item.quantity;
          }
        }
      });
    });
    const categoryStatsArray = Object.values(categoryStats).sort((a, b) => b.orderCount - a.orderCount);
    
    // Popular combos (items ordered together)
    const comboCounts = {};
    recentOrders.forEach(order => {
      const itemTitles = order.items
        .filter(item => item.menuItemId)
        .map(item => item.menuItemId.title)
        .sort();
      
      for (let i = 0; i < itemTitles.length; i++) {
        for (let j = i + 1; j < itemTitles.length; j++) {
          const combo = `${itemTitles[i]} + ${itemTitles[j]}`;
          const mainItem = itemTitles[i];
          const pairedItem = itemTitles[j];
          if (!comboCounts[combo]) {
            comboCounts[combo] = { mainItem, pairedItem, count: 0 };
          }
          comboCounts[combo].count++;
        }
      }
    });
    const popularCombos = Object.values(comboCounts)
      .filter(combo => combo.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const orderAnalytics = {
      periodStats,
      todayTopItems,
      weekTopItems,
      weekTopDrinks,
      categoryStats: categoryStatsArray,
      popularCombos
    };
    
    // Use smart menu chat with real analytics
    const response = await aiService.getSmartMenuChatResponse(message, orderAnalytics, menuItems, conversationHistory || []);
    res.json({ response });
  } catch (error) {
    console.error("AI Smart Menu Chat Error:", error.message);
    res.status(500).json({ message: error.message || "Error generating AI response" });
  }
});

// Get AI analytics insight (admin only)
app.get("/api/v1/ai/analytics-insight", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    // Check if GROQ_API_KEY is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ 
        message: "AI service is not configured. Please contact the administrator.",
        error: "GROQ_API_KEY not found"
      });
    }

    // Fetch analytics data
    const orders = await Order.find({}).populate("items.menuItemId", "title price category");
    const items = await Menu.find({});

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "served").length;
    const totalRevenue = orders.filter((o) => o.status === "served").reduce((sum, o) => sum + (o.total || 0), 0);

    const analyticsData = {
      totalOrders,
      completedOrders,
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0,
      popularItems: items.map((item) => ({ title: item.title, popularity: item.popularity || 0 })).sort((a, b) => b.popularity - a.popularity).slice(0, 5),
    };

    const insight = await aiService.getAnalyticsInsight(analyticsData);
    res.json({ insight });
  } catch (error) {
    console.error("AI Analytics Insight Error:", error.message);
    res.status(500).json({ message: error.message || "Error generating AI insight" });
  }
});

// Check AI service status (public)
app.get("/api/v1/ai/status", async (req, res) => {
  const isConfigured = !!process.env.GROQ_API_KEY;
  res.json({
    available: isConfigured,
    message: isConfigured ? "AI service is available" : "AI service is not configured"
  });
});

// ==================== LEGACY ENDPOINTS (For backward compatibility) ====================

// Legacy login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, status: "success" });
  } catch (error) {
    res.status(500).json({ message: "Error during login" });
  }
});

// Legacy add item endpoint
app.post("/additem", async (req, res) => {
  try {
    const newItem = new Menu({
      id: new mongoose.Types.ObjectId(),
      ...req.body,
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error adding item:", error.message);
    res.status(500).json({ message: "Error adding item" });
  }
});

// Legacy get items endpoint
app.get("/items", async (req, res) => {
  try {
    const items = await Menu.find({});
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error.message);
    res.status(500).json({ message: "Error fetching items" });
  }
});

// Legacy update item endpoint
app.post("/updateitem", async (req, res) => {
  try {
    const updatedItem = await Menu.findOneAndUpdate(
      { id: req.body.id },
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error.message);
    res.status(500).json({ message: "Error updating item" });
  }
});

// Legacy delete item endpoint
app.delete("/deleteitem/:id", async (req, res) => {
  try {
    const deletedItem = await Menu.findOneAndDelete({ id: req.params.id });
    res.json(deletedItem);
  } catch (error) {
    console.error("Error deleting item:", error.message);
    res.status(500).json({ message: "Error deleting item" });
  }
});

// ==================== HEALTH CHECK ====================

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size too large" });
    }
  }

  res.status(500).json({
    message: NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${NODE_ENV}`);
});
