// Bu script veritabanındaki tüm kullanıcıları listeler
require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI ayarlanmamış!");
  process.exit(1);
}

async function listUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✓ MongoDB'ye bağlandı\n");

    const users = await User.find({}, "username role email isActive createdAt");
    
    console.log("📋 Kullanıcı Listesi:\n");
    console.log("─".repeat(70));
    console.log("| Username          | Role      | Email                  | Active |");
    console.log("─".repeat(70));
    
    users.forEach(user => {
      console.log(`| ${(user.username || "").padEnd(17)} | ${(user.role || "").padEnd(9)} | ${(user.email || "-").padEnd(22)} | ${user.isActive ? "✓" : "✗"}    |`);
    });
    
    console.log("─".repeat(70));
    console.log(`\nToplam: ${users.length} kullanıcı\n`);

    // Rol dağılımı
    const roleCount = {};
    users.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });
    
    console.log("📊 Rol Dağılımı:");
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    await mongoose.disconnect();
    console.log("\n✓ Bağlantı kapatıldı");
  } catch (error) {
    console.error("❌ Hata:", error.message);
    process.exit(1);
  }
}

listUsers();