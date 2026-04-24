const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/.env' });

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
  role: { type: String, enum: ['admin', 'manager', 'waiter', 'customer', 'superadmin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  tableNumber: Number,
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

// Türk Menüsü - Akay Restaurant
const sampleMenuItems = [
  // === KAHVALTI ===
  {
    category: "Kahvaltı",
    subcategory: "Serpme Kahvaltı",
    title: "Akay Serpme Kahvaltı",
    desc: "2 kişilik zengin serpme kahvaltı, peynir çeşitleri, zeytin, domates, salatalık, bal, kaymak",
    price: 180,
    img: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 25
  },
  {
    category: "Kahvaltı",
    subcategory: "Serpme Kahvaltı",
    title: "Tek Kişilik Kahvaltı",
    desc: "Simit, beyaz peynir, kaşar, yumurta, domates, salatalık, zeytin, bal",
    price: 85,
    img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 20
  },
  {
    category: "Kahvaltı",
    subcategory: "Yumurta",
    title: "Menemen",
    desc: "Domatesli, biberli yumurta, taze ekmek ile",
    price: 45,
    img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 35
  },
  {
    category: "Kahvaltı",
    subcategory: "Yumurta",
    title: "Sucuklu Yumurta",
    desc: "Taze sucuk ve yumurta, ekmek ile",
    price: 55,
    img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 30
  },
  {
    category: "Kahvaltı",
    subcategory: "Yumurta",
    title: "Kaşarlı Yumurta",
    desc: "Tavada erimiş kaşar ile servis edilen yumurta",
    price: 50,
    img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 28
  },
  {
    category: "Kahvaltı",
    subcategory: "Gözleme",
    title: "Ispanaklı Gözleme",
    desc: "Taze ıspanak ve peynir ile",
    price: 45,
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 22
  },
  {
    category: "Kahvaltı",
    subcategory: "Gözleme",
    title: "Patatesli Gözleme",
    desc: "Özel baharatlı patates içi ile",
    price: 40,
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 18
  },
  {
    category: "Kahvaltı",
    subcategory: "Gözleme",
    title: "Karışık Gözleme",
    desc: "Peynir, ıspanak ve patates karışık",
    price: 50,
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 24
  },
  {
    category: "Kahvaltı",
    subcategory: "Tost",
    title: "Kaşarlı Tost",
    desc: "Açık ateşte pişirilmiş kaşar peynirli tost",
    price: 35,
    img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 40
  },
  {
    category: "Kahvaltı",
    subcategory: "Tost",
    title: "Karışık Tost",
    desc: "Kaşar, salam, sucuk karışık",
    price: 45,
    img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 35
  },
  {
    category: "Kahvaltı",
    subcategory: "Tost",
    title: "Akay Special Tost",
    desc: "Özel sos, kaşar, mantar ve sucuk",
    price: 55,
    img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
    discount: 10,
    isAvailable: true,
    popularity: 30
  },
  {
    category: "Kahvaltı",
    subcategory: "Açık Büfe",
    title: "Simit + Çay",
    desc: "Taze simit ve Türk çayı",
    price: 25,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 45
  },
  {
    category: "Kahvaltı",
    subcategory: "Açık Büfe",
    title: "Sahlep",
    desc: "Geleneksel sıcak içecek, kaymak ve fıstık ile",
    price: 35,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 15
  },

  // === ÇORBALAR ===
  {
    category: "Çorbalar",
    subcategory: "Kase Çorba",
    title: "Mercimek Çorbası",
    desc: "Geleneksel kırmızı mercimek çorbası, limon ve nane ile",
    price: 35,
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 38
  },
  {
    category: "Çorbalar",
    subcategory: "Kase Çorba",
    title: "İşkembe Çorbası",
    desc: "Yoğurtlu işkembe çorbası, sarımsak ve sirke ile",
    price: 50,
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 25
  },
  {
    category: "Çorbalar",
    subcategory: "Kase Çorba",
    title: "Yayla Çorbası",
    desc: "Pirinç ve yoğurt ile yapılan eşek yoğurdu çorbası",
    price: 35,
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 20
  },
  {
    category: "Çorbalar",
    subcategory: "Kase Çorba",
    title: "Domates Çorbası",
    desc: "Krema ile zenginleştirilmiş domates çorbası",
    price: 40,
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 18
  },

  // === ANA YEMEKLER ===
  {
    category: "Ana Yemekler",
    subcategory: "Izgara",
    title: "Adana Kebap",
    desc: "Acılı kıyma kebabı, pilav ve közde domates ile",
    price: 120,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 42
  },
  {
    category: "Ana Yemekler",
    subcategory: "Izgara",
    title: "Urfa Kebap",
    desc: "Tatlı urfa kebabı, pilav ve köz domates ile",
    price: 120,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 38
  },
  {
    category: "Ana Yemekler",
    subcategory: "Izgara",
    title: "Porsiyon Köfte",
    desc: "4 adet ızgara köfte, patates kızartması ve salata ile",
    price: 95,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 35
  },
  {
    category: "Ana Yemekler",
    subcategory: "Izgara",
    title: "Tavuk Şiş",
    desc: "Marine edilmiş tavuk şiş, pilav ve sebze ile",
    price: 85,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 30
  },
  {
    category: "Ana Yemekler",
    subcategory: "Izgara",
    title: "Kuzu Pirzola",
    desc: "Izgara kuzu pirzola, fırın patates ve salata ile",
    price: 180,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 20
  },
  {
    category: "Ana Yemekler",
    subcategory: "Kavurma",
    title: "Saç Kavurma",
    desc: "Dana eti, pepper, soğan ve baharatlarla",
    price: 110,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 28
  },
  {
    category: "Ana Yemekler",
    subcategory: "Kavurma",
    title: "Ciğer Kavurma",
    desc: "Akciğer kavurması, pilav ve soğan ile",
    price: 85,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 15
  },
  {
    category: "Ana Yemekler",
    subcategory: "Pilav & İçeren",
    title: "Etli Pilav",
    desc: "Kısır pilav üzerinde haşlama et ile",
    price: 75,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 25
  },
  {
    category: "Ana Yemekler",
    subcategory: "Pilav & İçeren",
    title: "Mantı",
    desc: "Ev yapımı mantı, yoğurt ve tere yağı ile",
    price: 90,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 32
  },
  {
    category: "Ana Yemekler",
    subcategory: "Pilav & İçeren",
    title: "İskender",
    desc: "Döner, yoğurt, tereyağlı domates sosu ile",
    price: 130,
    img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 45
  },

  // === TATLILAR ===
  {
    category: "Tatlılar",
    subcategory: "Sıcak Tatlı",
    title: "Künefe",
    desc: "Antep fıstıklı künefe, kaymak ile",
    price: 70,
    img: "https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 40
  },
  {
    category: "Tatlılar",
    subcategory: "Sıcak Tatlı",
    title: "Katmer",
    desc: "Gaziantep katmeri, kaymak ve fıstık ile",
    price: 65,
    img: "https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 28
  },
  {
    category: "Tatlılar",
    subcategory: "Sıcak Tatlı",
    title: "Aşure",
    desc: "Geleneksel aşure, nohut, fasulye, buğday ile",
    price: 40,
    img: "https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 22
  },
  {
    category: "Tatlılar",
    subcategory: "Soğuk Tatlı",
    title: "Sütlaç",
    desc: "Fırın sütlaç, tarçın ile",
    price: 40,
    img: "https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 35
  },
  {
    category: "Tatlılar",
    subcategory: "Soğuk Tatlı",
    title: "Kazandibi",
    desc: "Karamelize üstü süt tatlısı",
    price: 40,
    img: "https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 25
  },
  {
    category: "Tatlılar",
    subcategory: "Baklava",
    title: "Gaziantep Baklavası",
    desc: "El açması, antep fıstıklı",
    price: 60,
    img: "https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 38
  },
  {
    category: "Tatlılar",
    subcategory: "Baklava",
    title: "Şöbiyet",
    desc: "İrmikli, şerbetli tatlı",
    price: 50,
    img: "https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 20
  },

  // === İÇECEKLER ===
  {
    category: "İçecekler",
    subcategory: "Sıcak İçecekler",
    title: "Türk Kahvesi (Şekerli)",
    desc: "Geleneksel Türk kahvesi, orta şekerli",
    price: 25,
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 50
  },
  {
    category: "İçecekler",
    subcategory: "Sıcak İçecekler",
    title: "Türk Kahvesi (Saksı)",
    desc: "İki fincan Türk kahvesi",
    price: 40,
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 35
  },
  {
    category: "İçecekler",
    subcategory: "Sıcak İçecekler",
    title: "Çay (Bardak)",
    desc: "Taze demle çay",
    price: 10,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 60
  },
  {
    category: "İçecekler",
    subcategory: "Sıcak İçecekler",
    title: "Çay (İkili)",
    desc: "İki bardak çay",
    price: 18,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 45
  },
  {
    category: "İçecekler",
    subcategory: "Soğuk İçecekler",
    title: "Ayran",
    desc: "Geleneksel yoğurtlu ayran",
    price: 15,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 55
  },
  {
    category: "İçecekler",
    subcategory: "Soğuk İçecekler",
    title: "Şalgam",
    desc: "Acılı şalgam suyu",
    price: 20,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 30
  },
  {
    category: "İçecekler",
    subcategory: "Soğuk İçecekler",
    title: "Meyve Suyu",
    desc: "Şeftali / Portakal / Elma",
    price: 15,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 25
  },
  {
    category: "İçecekler",
    subcategory: "Soğuk İçecekler",
    title: "Soda",
    desc: "Limonlu /ORMAL soda",
    price: 12,
    img: "https://images.unsplash.com/photo-1544789571-f1d5fe3d3b0c?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 35
  },

  // === KAHVE & PASTA ===
  {
    category: "Kahve & Pasta",
    subcategory: "Kahveler",
    title: "Americano",
    desc: "Espresso bazlı americano",
    price: 30,
    img: "https://images.unsplash.com/photo-1495474472635-c4a1ad2cec33?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 28
  },
  {
    category: "Kahve & Pasta",
    subcategory: "Kahveler",
    title: "Latte",
    desc: "Sütlü kahve, late art",
    price: 35,
    img: "https://images.unsplash.com/photo-1495474472635-c4a1ad2cec33?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 32
  },
  {
    category: "Kahve & Pasta",
    subcategory: "Kahveler",
    title: "Cappuccino",
    desc: "Köpüklü kahve",
    price: 35,
    img: "https://images.unsplash.com/photo-1495474472635-c4a1ad2cec33?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 30
  },
  {
    category: "Kahve & Pasta",
    subcategory: "Kek & Kurabiye",
    title: "Islak Kek",
    desc: "Çikolatalı ıslak kek",
    price: 30,
    img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 25
  },
  {
    category: "Kahve & Pasta",
    subcategory: "Kek & Kurabiye",
    title: "Havuçlu Kek",
    desc: "Taze havuçlu kek, krema ile",
    price: 35,
    img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 20
  },
  {
    category: "Kahve & Pasta",
    subcategory: "Kek & Kurabiye",
    title: "Kurabiye (3'lü)",
    desc: "Ev yapımı kurabiye çeşitleri",
    price: 25,
    img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop",
    discount: 0,
    isAvailable: true,
    popularity: 18
  }
];

// Kullanıcılar - sadece root
const sampleUsers = [
  {
    username: "root",
    password: "root123",
    email: "root@akay.com",
    role: "superadmin",
    isActive: true
  }
];

// Yardımcı fonksiyon: Rastgele tarih üret (son 30 gün içinde)
function getRandomDate(daysAgo) {
  const now = new Date();
  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const hour = Math.floor(Math.random() * 14) + 8; // 08:00 - 21:00
  const minute = Math.floor(Math.random() * 60);
  targetDate.setHours(hour, minute, 0, 0);
  return targetDate;
}

// Sipariş üret - tutarlı senaryo
function generateOrders(menus) {
  const orders = [];
  
  // Ürün referansları
  const menemen = menus.find(m => m.title === 'Menemen');
  const sucukYumurta = menus.find(m => m.title === 'Sucuklu Yumurta');
  const kasaarliYumurta = menus.find(m => m.title === 'Kaşarlı Yumurta');
  const serpme = menus.find(m => m.title === 'Akay Serpme Kahvaltı');
  const tekKahvalti = menus.find(m => m.title === 'Tek Kişilik Kahvaltı');
  const simitCay = menus.find(m => m.title === 'Simit + Çay');
  const gozlemeKar = menus.find(m => m.title === 'Karışık Gözleme');
  const gozlemeIspanak = menus.find(m => m.title === 'Ispanaklı Gözleme');
  const kasaarliTost = menus.find(m => m.title === 'Kaşarlı Tost');
  const karisikTost = menus.find(m => m.title === 'Karışık Tost');
  const specialTost = menus.find(m => m.title === 'Akay Special Tost');
  const mercimek = menus.find(m => m.title === 'Mercimek Çorbası');
  const iskembe = menus.find(m => m.title === 'İşkembe Çorbası');
  const adana = menus.find(m => m.title === 'Adana Kebap');
  const urfa = menus.find(m => m.title === 'Urfa Kebap');
  const kofte = menus.find(m => m.title === 'Porsiyon Köfte');
  const tavukSis = menus.find(m => m.title === 'Tavuk Şiş');
  const iskender = menus.find(m => m.title === 'İskender');
const manti = menus.find(m => m.title === 'Mantı');
const etliPilav = menus.find(m => m.title === 'Etli Pilav');
const pilav = menus.find(m => m.title === 'Etli Pilav');
const sacKavurma = menus.find(m => m.title === 'Saç Kavurma');
const kuzuPirzola = menus.find(m => m.title === 'Kuzu Pirzola');
const cigerKavurma = menus.find(m => m.title === 'Ciğer Kavurma');
  const kunefe = menus.find(m => m.title === 'Künefe');
  const sutlac = menus.find(m => m.title === 'Sütlaç');
  const baklava = menus.find(m => m.title === 'Gaziantep Baklavası');
  const turkKahve = menus.find(m => m.title === 'Türk Kahvesi (Şekerli)');
  const turkKahveSaksi = menus.find(m => m.title === 'Türk Kahvesi (Saksı)');
  const cay = menus.find(m => m.title === 'Çay (Bardak)');
  const cayIkili = menus.find(m => m.title === 'Çay (İkili)');
  const ayran = menus.find(m => m.title === 'Ayran');
  const salgam = menus.find(m => m.title === 'Şalgam');
  const soda = menus.find(m => m.title === 'Soda');
  const sahlep = menus.find(m => m.title === 'Sahlep');
  const americano = menus.find(m => m.title === 'Americano');
  const latte = menus.find(m => m.title === 'Latte');
  const cappuccino = menus.find(m => m.title === 'Cappuccino');
  const wslakKek = menus.find(m => m.title === 'Islak Kek');
  const katmer = menus.find(m => m.title === 'Katmer');

  // Masalar
  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  // Senaryo: Hafta içi sabah kahvaltı yoğunluğu
  const breakfastOrders = [
    // Pazar sabahı - çok yoğun (15 sipariş)
    { items: [[serpme, 1], [cayIkili, 1], [ayran, 1]], table: 3, daysAgo: 7, status: 'served' },
    { items: [[tekKahvalti, 1], [cay, 1]], table: 5, daysAgo: 7, status: 'served' },
    { items: [[menemen, 2], [simitCay, 2]], table: 1, daysAgo: 7, status: 'served' },
    { items: [[gozlemeKar, 1], [ayran, 1]], table: 7, daysAgo: 7, status: 'served' },
    { items: [[kasaarliTost, 2], [cayIkili, 1]], table: 2, daysAgo: 7, status: 'served' },
    { items: [[sucukYumurta, 1], [simitCay, 1]], table: 8, daysAgo: 7, status: 'served' },
    { items: [[karisikTost, 1], [salgam, 1]], table: 4, daysAgo: 7, status: 'served' },
    { items: [[menemen, 1], [kasaarliYumurta, 1], [cayIkili, 1]], table: 6, daysAgo: 7, status: 'served' },
    { items: [[gozlemeIspanak, 2], [ayran, 2]], table: 9, daysAgo: 7, status: 'served' },
    { items: [[tekKahvalti, 2], [sahlep, 1]], table: 10, daysAgo: 7, status: 'served' },
    { items: [[serpme, 1], [turkKahveSaksi, 1]], table: 3, daysAgo: 7, status: 'served' },
    { items: [[specialTost, 1], [cay, 1]], table: 1, daysAgo: 7, status: 'served' },
    { items: [[menemen, 3], [simitCay, 2]], table: 5, daysAgo: 7, status: 'served' },
    { items: [[kasaarliTost, 1], [kasaarliYumurta, 1]], table: 7, daysAgo: 7, status: 'served' },
    { items: [[gozlemeKar, 1], [kunefe, 1]], table: 2, daysAgo: 7, status: 'served' },
    
    // Cumartesi sabahı - yoğun (12 sipariş)
    { items: [[serpme, 1], [ayran, 1]], table: 5, daysAgo: 6, status: 'served' },
    { items: [[menemen, 2], [cayIkili, 1]], table: 3, daysAgo: 6, status: 'served' },
    { items: [[kasaarliTost, 3], [soda, 2]], table: 1, daysAgo: 6, status: 'served' },
    { items: [[tekKahvalti, 1], [sahlep, 1]], table: 8, daysAgo: 6, status: 'served' },
    { items: [[gozlemeKar, 2], [ayran, 2]], table: 4, daysAgo: 6, status: 'served' },
    { items: [[sucukYumurta, 1], [simitCay, 1]], table: 7, daysAgo: 6, status: 'served' },
    { items: [[karisikTost, 1], [salgam, 1]], table: 9, daysAgo: 6, status: 'served' },
    { items: [[menemen, 1], [kasaarliYumurta, 1]], table: 2, daysAgo: 6, status: 'served' },
    { items: [[gozlemeIspanak, 1], [kunefe, 1]], table: 6, daysAgo: 6, status: 'served' },
    { items: [[serpme, 1], [turkKahveSaksi, 1]], table: 10, daysAgo: 6, status: 'served' },
    { items: [[specialTost, 2], [cayIkili, 1]], table: 5, daysAgo: 6, status: 'served' },
    { items: [[tekKahvalti, 1], [sutlac, 1]], table: 3, daysAgo: 6, status: 'served' },

    // Hafta içi sabah - normal (8 sipariş/gün)
    // Pazartesi - 3 gün önce
    { items: [[menemen, 1], [simitCay, 1]], table: 2, daysAgo: 3, status: 'served' },
    { items: [[kasaarliTost, 1], [cay, 1]], table: 4, daysAgo: 3, status: 'served' },
    { items: [[gozlemeKar, 1], [ayran, 1]], table: 7, daysAgo: 3, status: 'served' },
    { items: [[tekKahvalti, 1], [sahlep, 1]], table: 1, daysAgo: 3, status: 'served' },
    { items: [[sucukYumurta, 1], [cay, 1]], table: 5, daysAgo: 3, status: 'served' },
    { items: [[karisikTost, 1], [soda, 1]], table: 9, daysAgo: 3, status: 'served' },
    { items: [[menemen, 1], [kasaarliYumurta, 1]], table: 3, daysAgo: 3, status: 'served' },
    { items: [[serpme, 1]], table: 8, daysAgo: 3, status: 'served' },

    // Salı - 2 gün önce
    { items: [[menemen, 2], [cayIkili, 1]], table: 1, daysAgo: 2, status: 'served' },
    { items: [[gozlemeIspanak, 1], [ayran, 1]], table: 6, daysAgo: 2, status: 'served' },
    { items: [[kasaarliTost, 1], [cay, 1]], table: 3, daysAgo: 2, status: 'served' },
    { items: [[specialTost, 1], [salgam, 1]], table: 8, daysAgo: 2, status: 'served' },
    { items: [[tekKahvalti, 1], [sutlac, 1]], table: 4, daysAgo: 2, status: 'served' },
    { items: [[sucukYumurta, 1], [simitCay, 1]], table: 10, daysAgo: 2, status: 'served' },
    { items: [[karisikTost, 1], [kunefe, 1]], table: 2, daysAgo: 2, status: 'served' },
    { items: [[menemen, 1]], table: 7, daysAgo: 2, status: 'served' },

    // Çarşamba - 1 gün önce
    { items: [[serpme, 1], [turkKahveSaksi, 1]], table: 5, daysAgo: 1, status: 'served' },
    { items: [[menemen, 1], [cay, 1]], table: 2, daysAgo: 1, status: 'served' },
    { items: [[gozlemeKar, 2], [ayran, 2]], table: 9, daysAgo: 1, status: 'served' },
    { items: [[kasaarliTost, 1], [sahlep, 1]], table: 3, daysAgo: 1, status: 'served' },
    { items: [[tekKahvalti, 1], [soda, 1]], table: 7, daysAgo: 1, status: 'served' },
    { items: [[sucukYumurta, 1], [simitCay, 1]], table: 1, daysAgo: 1, status: 'served' },
    { items: [[karisikTost, 1]], table: 6, daysAgo: 1, status: 'served' },
    { items: [[menemen, 2], [cayIkili, 1]], table: 10, daysAgo: 1, status: 'served' },
  ];

  // Öğle yemeği siparişleri
  const lunchOrders = [
    // Bugün - öğle (5 sipariş)
    { items: [[mercimek, 2], [iskender, 1]], table: 3, daysAgo: 0, status: 'served' },
    { items: [[adana, 1], [ayran, 1]], table: 7, daysAgo: 0, status: 'served' },
{ items: [[manti, 1], [salgam, 1]], table: 1, daysAgo: 0, status: 'served' },
    { items: [[iskembe, 1], [etliPilav, 1]], table: 5, daysAgo: 0, status: 'confirmed' },
    { items: [[kofte, 1], [pilav, 1]], table: 9, daysAgo: 0, status: 'pending' },

    // Dün öğle (6 sipariş)
{ items: [[mercimek, 1], [adana, 2]], table: 2, daysAgo: 1, status: 'served' },
    { items: [[urfa, 1], [ayran, 1]], table: 8, daysAgo: 1, status: 'served' },
    { items: [[manti, 2], [kunefe, 1]], table: 4, daysAgo: 1, status: 'served' },
    { items: [[iskender, 1], [soda, 1]], table: 6, daysAgo: 1, status: 'served' },
    { items: [[tavukSis, 1], [pilav, 1]], table: 10, daysAgo: 1, status: 'served' },
    { items: [[kofte, 2]], table: 1, daysAgo: 1, status: 'served' },

    // 2 gün önce öğle (5 sipariş)
{ items: [[mercimek, 3], [adana, 1]], table: 5, daysAgo: 2, status: 'served' },
    { items: [[urfa, 2], [ayran, 2]], table: 3, daysAgo: 2, status: 'served' },
    { items: [[manti, 1], [baklava, 2]], table: 9, daysAgo: 2, status: 'served' },
    { items: [[iskender, 2]], table: 7, daysAgo: 2, status: 'served' },
    { items: [[tavukSis, 1], [salgam, 1]], table: 2, daysAgo: 2, status: 'served' },
  ];

  // Akşam yemeği siparişleri
  const dinnerOrders = [
    // 3 gün önce akşam (yoğun)
{ items: [[adana, 3], [urfa, 2], [ayran, 5]], table: 3, daysAgo: 3, status: 'served' },
    { items: [[iskender, 2], [mercimek, 2]], table: 7, daysAgo: 3, status: 'served' },
    { items: [[manti, 1], [kunefe, 2], [sutlac, 2]], table: 1, daysAgo: 3, status: 'served' },
    { items: [[kofte, 2], [cay, 2]], table: 5, daysAgo: 3, status: 'served' },
    { items: [[tavukSis, 1], [pilav, 1]], table: 9, daysAgo: 3, status: 'served' },
    { items: [[adana, 1], [urfa, 1], [ayran, 2]], table: 2, daysAgo: 3, status: 'served' },
    { items: [[sacKavurma, 1], [adana, 1]], table: 8, daysAgo: 3, status: 'served' },
    { items: [[kuzuPirzola, 1], [cay, 1]], table: 4, daysAgo: 3, status: 'served' },
    { items: [[cigerKavurma, 1], [pilav, 1]], table: 10, daysAgo: 3, status: 'served' },
    { items: [[manti, 2], [baklava, 2]], table: 6, daysAgo: 3, status: 'served' },

    // 4 gün önce akşam (normal)
{ items: [[adana, 2], [ayran, 3]], table: 5, daysAgo: 4, status: 'served' },
    { items: [[iskender, 1], [soda, 1]], table: 2, daysAgo: 4, status: 'served' },
    { items: [[manti, 1], [kunefe, 1]], table: 8, daysAgo: 4, status: 'served' },
    { items: [[kofte, 1], [cay, 1]], table: 3, daysAgo: 4, status: 'served' },
    { items: [[urfa, 1], [mercimek, 1]], table: 9, daysAgo: 4, status: 'served' },
    { items: [[tavukSis, 2]], table: 1, daysAgo: 4, status: 'served' },

    // 5 gün önce akşam
{ items: [[adana, 1], [urfa, 1], [ayran, 2]], table: 7, daysAgo: 5, status: 'served' },
    { items: [[iskender, 2]], table: 4, daysAgo: 5, status: 'served' },
    { items: [[manti, 1], [baklava, 1]], table: 10, daysAgo: 5, status: 'served' },
    { items: [[kofte, 2], [cay, 1]], table: 2, daysAgo: 5, status: 'served' },
    { items: [[sacKavurma, 1]], table: 6, daysAgo: 5, status: 'served' },

    // 6 gün önce akşam (cuma - yoğun)
{ items: [[adana, 4], [urfa, 3], [ayran, 8]], table: 3, daysAgo: 6, status: 'served' },
    { items: [[iskender, 3], [mercimek, 3]], table: 7, daysAgo: 6, status: 'served' },
    { items: [[manti, 2], [kunefe, 3], [sutlac, 2]], table: 1, daysAgo: 6, status: 'served' },
    { items: [[kofte, 3], [cay, 2]], table: 5, daysAgo: 6, status: 'served' },
    { items: [[tavukSis, 2], [pilav, 2]], table: 9, daysAgo: 6, status: 'served' },
    { items: [[adana, 2], [ayran, 3]], table: 2, daysAgo: 6, status: 'served' },
    { items: [[kuzuPirzola, 1], [cay, 1]], table: 8, daysAgo: 6, status: 'served' },
    { items: [[cigerKavurma, 2], [pilav, 2]], table: 4, daysAgo: 6, status: 'served' },
  ];

  // Rastgele ek siparişler (geçmiş 2-4 gün önce)
  const randomOrders = [
    { items: [[turkKahve, 2], [wslakKek, 1]], table: 5, daysAgo: 4, status: 'served' },
    { items: [[latte, 1], [cappuccino, 1]], table: 3, daysAgo: 3, status: 'served' },
    { items: [[kunefe, 2], [sahlep, 1]], table: 8, daysAgo: 5, status: 'served' },
    { items: [[sutlac, 3], [baklava, 2]], table: 1, daysAgo: 2, status: 'served' },
    { items: [[americano, 2], [ayran, 1]], table: 7, daysAgo: 1, status: 'served' },
    { items: [[katmer, 1], [kunefe, 1]], table: 4, daysAgo: 6, status: 'served' },
    { items: [[baklava, 3], [sutlac, 2]], table: 9, daysAgo: 3, status: 'served' },
    { items: [[turkKahveSaksi, 2]], table: 2, daysAgo: 4, status: 'served' },
    { items: [[ayran, 4], [salgam, 2]], table: 10, daysAgo: 2, status: 'served' },
    { items: [[latte, 3], [wslakKek, 2]], table: 6, daysAgo: 5, status: 'served' },
  ];

  // Tüm siparişleri birleştir
  const allOrderData = [...breakfastOrders, ...lunchOrders, ...dinnerOrders, ...randomOrders];

  allOrderData.forEach(orderData => {
    let total = 0;
    const items = orderData.items.map(([menuItem, quantity]) => {
      const price = menuItem.price;
      total += price * quantity;
      return {
        menuItemId: menuItem._id.toString(),
        title: menuItem.title,
        price: price,
        quantity: quantity,
        discount: 0
      };
    });

    orders.push({
      tableNumber: orderData.table,
      items: items,
      total: total,
      status: orderData.status,
      notes: '',
      createdAt: getRandomDate(orderData.daysAgo),
      updatedAt: getRandomDate(orderData.daysAgo)
    });
  });

  return orders;
}

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
    console.log('🗑️  Tüm mevcut veriler temizlendi (menu, user, order)');

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
    console.log(`✅ ${insertedUsers.length} kullanıcı eklendi (sadece root)`);

    // Siparişler oluştur
    const sampleOrders = generateOrders(insertedMenus);
    const insertedOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ ${insertedOrders.length} sipariş eklendi (son 7 gün içinde)`);

    // İstatistikler
    console.log('\n📊 VERİTABANI İSTATİSTİKLERİ');
    console.log('═══════════════════════════════════════');
    console.log(`🍽️  Menü Kategorileri:`);
    
    const categories = [...new Set(insertedMenus.map(m => m.category))];
    categories.forEach(cat => {
      const count = insertedMenus.filter(m => m.category === cat).length;
      console.log(`   • ${cat}: ${count} ürün`);
    });
    
    console.log(`\n📝 Sipariş Dağılımı:`);
    const servedCount = insertedOrders.filter(o => o.status === 'served').length;
    const pendingCount = insertedOrders.filter(o => o.status === 'pending').length;
    const confirmedCount = insertedOrders.filter(o => o.status === 'confirmed').length;
    console.log(`   • Servis edildi: ${servedCount}`);
    console.log(`   • Bekleyen: ${pendingCount}`);
    console.log(`   • Onaylandı: ${confirmedCount}`);

    console.log(`\n💰 Toplam Ciro: ${insertedOrders.reduce((sum, o) => sum + o.total, 0)} ₺`);

    console.log('\n═══════════════════════════════════════');
    console.log('\n👤 GİRİŞ BİLGİLERİ:');
    console.log(`   Kullanıcı: root`);
    console.log(`   Şifre: root123`);
    console.log('═══════════════════════════════════════');

    console.log('\n🎉 Akay Restaurant veritabanı başarıyla dolduruldu!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

// Seed'i çalıştır
seedDatabase();