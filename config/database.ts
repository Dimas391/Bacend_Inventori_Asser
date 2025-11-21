import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Starting database configuration...');

// Gunakan MYSQL_PUBLIC_URL dari Railway
const connectionString = process.env.MYSQL_PUBLIC_URL;

if (!connectionString) {
  console.error('❌ MYSQL_PUBLIC_URL tidak ditemukan');
  process.exit(1);
}

console.log('✅ MYSQL_PUBLIC_URL ditemukan');

// Parse connection string
const url = new URL(connectionString);

console.log('📋 Database configuration:');
console.log('   Host:', url.hostname);
console.log('   Port:', url.port);
console.log('   User:', url.username);
console.log('   Database:', url.pathname.substring(1));

// Buat database pool dengan config yang valid
const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
  ssl: { 
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000
});

// Test koneksi database
pool.getConnection()
  .then((connection) => {
    console.log('🎉 BERHASIL terhubung ke database!');
    connection.release();
  })
  .catch((error) => {
    console.error('❌ GAGAL terhubung ke database:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
  });

export default pool;