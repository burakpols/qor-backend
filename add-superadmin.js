// One-time script to add superadmin to the database
// Usage: node add-superadmin.js

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function addSuperadmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Check if superadmin already exists
    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('⚠️  Superadmin zaten mevcut:', existing.username);
      process.exit(0);
    }

    // Create superadmin (pre-save hook will hash the password)
    const superadmin = new User({
      username: 'root',
      password: 'root123',
      role: 'superadmin',
      isActive: true,
    });

    await superadmin.save();

    console.log('✅ Superadmin başarıyla eklendi!');
    console.log('👤 Giriş Bilgileri:');
    console.log('   Kullanıcı adı: root');
    console.log('   Şifre: root123');
    console.log('   Rol: superadmin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

addSuperadmin();