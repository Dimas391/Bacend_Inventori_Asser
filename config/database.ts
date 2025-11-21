import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Starting database configuration...');

// URL manual yang Anda berikan - PASTIKAN INI YANG DIGUNAKAN
const manualConnectionString = 'mysql://root:ztRelPVAzBCVGaROfEivGWvMphIMWZWd@hopper.proxy.rlwy.net:41017/railway';

// Prioritaskan MYSQL_PUBLIC_URL, jika tidak ada gunakan manual URL
const connectionString = process.env.MYSQL_PUBLIC_URL || manualConnectionString;

console.log('🔗 Using connection string:', connectionString.replace(/:[^:@]+@/, ':***@'));

// Parse connection string
const url = new URL(connectionString);

console.log('📋 Database configuration:');
console.log('   Host:', url.hostname);
console.log('   Port:', url.port);
console.log('   User:', url.username);
console.log('   Database:', url.pathname.substring(1));
console.log('   Password Length:', url.password ? url.password.length : 0);

// Buat database pool dengan config yang valid
const pool = mysql.createPool({
  host: url.hostname,        // hopper.proxy.rlwy.net
  port: parseInt(url.port),  // 41017
  user: url.username,        // root
  password: url.password,    // ztRelPVAzBCVGaROfEivGWvMphIMWZWd
  database: url.pathname.substring(1), // railway
  ssl: { 
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000
});

// Test koneksi database
console.log('\n🚀 Testing database connection...');
pool.getConnection()
  .then((connection) => {
    console.log('🎉 BERHASIL terhubung ke database!');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname.substring(1));
    
    // Test query tambahan
    return connection.query('SELECT 1 as test_value, NOW() as time')
      .then(([results]) => {
        console.log('✅ Test query berhasil:', results);
        connection.release();
      });
  })
  .catch((error) => {
    console.error('❌ GAGAL terhubung ke database:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Host:', url.hostname);
    console.error('   Port:', url.port);
    console.error('   User:', url.username);
  });

export default pool;