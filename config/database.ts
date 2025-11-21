import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

console.log('🔧 Starting database configuration...');

// URL manual yang Anda berikan
const manualConnectionString = 'mysql://root:ztRelPVAzBCVGaROfEivGWvMphIMWZWd@hopper.proxy.rlwy.net:41017/railway';
const connectionString = process.env.MYSQL_PUBLIC_URL || manualConnectionString;

console.log('🔗 Using connection string:', connectionString.replace(/:[^:@]+@/, ':***@'));

const url = new URL(connectionString);

console.log('📋 Database configuration:');
console.log('   Host:', url.hostname);
console.log('   Port:', url.port);
console.log('   User:', url.username);
console.log('   Database:', url.pathname.substring(1));

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

// Fungsi untuk run migration
async function runMigrations() {
  const sqlPath = path.resolve(process.cwd(), 'config', 'database.schema.sql');
  
  try {
    console.log(`\n📦 Checking migration file: ${sqlPath}`);
    await fs.access(sqlPath);
    
    console.log('✅ Migration file found, executing...');
    const sql = await fs.readFile(sqlPath, 'utf8');
    const cleanedSql = sql.replace(/^\uFEFF/, '');

    const conn = await pool.getConnection();
    try {
      console.log('🚀 Creating database tables...');
      await conn.query(cleanedSql);
      console.log('✅ Database migration completed successfully!');
    } finally {
      conn.release();
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('⚠️ Migration file not found, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  }
}

// Test koneksi dan run migration
console.log('\n🚀 Testing database connection...');
pool.getConnection()
  .then(async (connection) => {
    console.log('🎉 BERHASIL terhubung ke database!');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname.substring(1));
    
    // Jalankan migration setelah koneksi berhasil
    await runMigrations();
    
    connection.release();
  })
  .catch((error) => {
    console.error('❌ GAGAL terhubung ke database:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
  });

export default pool;