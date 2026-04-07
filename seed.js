const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

// Model tanımlamaları
const menuSchema = new mongoose.Schema({
  category: String,
  subcategory: String,
  title: String,
  desc: String,
  price: Number,
  img: String,
  discount: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  popularity: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: { type: String, enum: ['admin', 'manager', 'waiter', 'customer'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{
    menuItemId: String,
    title: String,
    price: Number,
    quantity: Number,
    discount: { type: Number, default: 0 }
  }],
  total: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'prepared', 'served', 'cancelled'], default: 'pending' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Menu = mongoose.model('Menu', menuSchema, 'menu');
const User = mongoose.model('User', userSchema, 'user');
const Order = mongoose.model('Order', orderSchema, 'order');

// Örnek Veriler
const sampleMenuItems = [
  {
    category: "Burgers",
    subcategory: "Classic",
    title: "Hamburger",
    desc: "Taze et, marul, domates ve özel sosla yapılan klasik burger",
    price: 45,
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 5
  },
  {
    category: "Burgers",
    subcategory: "Premium",
    title: "Bacon Cheeseburger",
    desc: "Çifte et, bacon, cheddar peyniri ve caramelized soğan",
    price: 65,
    img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop",
    discount: 10,
    isAvailable: true,
    popularity: 8
  },
  {
    category: "Pizza",
    subcategory: "Classic",
    title: "Margherita",
    desc: "Domates, mozzarella, fesleğen ve zeytinyağı",
    price: 55,
    img: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 10
  },
  {
    category: "Pizza",
    subcategory: "Special",
    title: "Pepperoni Pizza",
    desc: "Pepperoni ve ekstra mozzarella",
    price: 65,
    img: "https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=400&h=300&fit=crop",
    discount: 15,
    isAvailable: true,
    popularity: 12
  },
  {
    category: "Pizza",
    subcategory: "Special",
    title: "Dört Peynirli Pizza",
    desc: "Mozzarella, feta, cheddar ve parmesan peyniri",
    price: 75,
    img: "https://images.unsplash.com/photo-1571407-918fcfb3241f?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 6
  },
  {
    category: "Salads",
    subcategory: "Fresh",
    title: "Coban Salad",
    desc: "Domates, salatalık, soğan ve olive yağı",
    price: 35,
    img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 4
  },
  {
    category: "Salads",
    subcategory: "Fresh",
    title: "Caeser Salad",
    desc: "Romaine, parmesan, croutons ve Caesar soslu",
    price: 40,
    img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    discount: 5,
    isAvailable: true,
    popularity: 3
  },
  {
    category: "Beverages",
    subcategory: "Hot",
    title: "Americano",
    desc: "Sıcak Amerikan kahvesi",
    price: 15,
    img: "https://images.unsplash.com/photo-1495474472635-c4a1ad2cec33?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 15
  },
  {
    category: "Beverages",
    subcategory: "Cold",
    title: "Iced Latte",
    desc: "Soğuk süte halı latte",
    price: 20,
    img: "https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 9
  },
  {
    category: "Desserts",
    subcategory: "Sweet",
    title: "Cheesecake",
    desc: "Newwork style cheesecake",
    price: 30,
    img: "https://images.unsplash.com/photo-1533134242443-742c7bab9d51?w=400&h=300&fit=crop",
    discount: 20,
    isAvailable: true,
    popularity: 7
  },
  {
    category: "Desserts",
    subcategory: "Sweet",
    title: "Tiramisu",
    desc: "İtalyan klasik tatlısı",
    price: 35,
    img: "https://images.unsplash.com/photo-1571115764595-644a12c7fb3e?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 11
  },
  {
    category: "Pasta",
    subcategory: "Classic",
    title: "Spaghetti Carbonara",
    desc: "Pasta, pancetta, yumurta, parmesan",
    price: 50,
    img: "https://images.unsplash.com/photo-1612874742237-6526221fcf4f?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 8
  }
];

const sampleUsers = [
  {
    username: "admin",
    password: "admin123", // Will be hashed
    email: "admin@mihman.com",
    role: "admin",
    isActive: true
  },
  {
    username: "manager",
    password: "manager123",
    email: "manager@mihman.com",
    role: "manager",
    isActive: true
  },
  {
    username: "waiter1",
    password: "waiter123",
    email: "waiter1@mihman.com",
    role: "waiter",
    isActive: true
  },
  {
    username: "waiter2",
    password: "waiter123",
    email: "waiter2@mihman.com",
    role: "waiter",
    isActive: true
  }
];

// Seed Fonksiyonu
async function seedDatabase() {
  try {
    // MongoDB bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Mevcut verileri temizle
    await Menu.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑️  Mevcut veriler temizlendi');

    // Menu öğeleri ekle
    const insertedMenus = await Menu.insertMany(sampleMenuItems);
    console.log(`✅ ${insertedMenus.length} menü öğesi eklendi`);

    // Users ekle (şifreleri hash'le)
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => {
        const hashedPassword = await bcryptjs.hash(user.password, 10);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    const insertedUsers = await User.insertMany(hashedUsers);
    console.log(`✅ ${insertedUsers.length} kullanıcı eklendi`);

    // Örnek siparişler ekle
    const sampleOrders = [
      {
        userId: insertedUsers[3]._id, // customer
        items: [
          {
            menuItemId: insertedMenus[0]._id,
            title: "Hamburger",
            price: 45,
            quantity: 2,
            discount: 0
          },
          {
            menuItemId: insertedMenus[7]._id,
            title: "Americano",
            price: 15,
            quantity: 2,
            discount: 0
          }
        ],
        total: 120,
        status: "served",
        notes: "Tuz az olsun"
      },
      {
        userId: insertedUsers[3]._id,
        items: [
          {
            menuItemId: insertedMenus[2]._id,
            title: "Margherita",
            price: 55,
            quantity: 1,
            discount: 0
          }
        ],
        total: 55,
        status: "pending",
        notes: ""
      },
      {
        userId: insertedUsers[3]._id,
        items: [
          {
            menuItemId: insertedMenus[11]._id,
            title: "Spaghetti Carbonara",
            price: 50,
            quantity: 1,
            discount: 0
          },
          {
            menuItemId: insertedMenus[10]._id,
            title: "Tiramisu",
            price: 35,
            quantity: 1,
            discount: 0
          }
        ],
        total: 85,
        status: "confirmed",
        notes: "Taze hazırlanacak"
      }
    ];

    const insertedOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ ${insertedOrders.length} sipariş eklendi`);

    console.log('\n🎉 Veritabanı başarıyla dolduruldu!');
    console.log('\n📊 İstatistikler:');
    console.log(`  - Menü Öğeleri: ${insertedMenus.length}`);
    console.log(`  - Kullanıcılar: ${insertedUsers.length}`);
    console.log(`  - Siparişler: ${insertedOrders.length}`);
    console.log('\n👤 Giriş Bilgileri:');
    sampleUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.username} / ${user.password} (${user.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

// Seed'i çalıştır
seedDatabase();
