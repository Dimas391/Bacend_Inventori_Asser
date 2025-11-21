// config/database.ts - USE MYSQL_PUBLIC_URL
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

console.log('🔍 Database Configuration:');

// GUNAKAN MYSQL_PUBLIC_URL yang berhasil!
const connectionString = process.env.MYSQL_PUBLIC_URL || 'mysql://root:BajyCIYofgbNHoljCVADzGvoFekpCwvK@maglev.proxy.rlwy.net:28305/railway';

console.log('🔗 Using MYSQL_PUBLIC_URL...');

// Parse connection string
const url = new URL(connectionString);

console.log('✅ Database config:', {
  host: url.hostname,
  port: url.port,
  user: url.username,
  database: url.pathname.substring(1)
});

const pool = mysql.createPool({
  host: url.hostname,        // maglev.proxy.rlwy.net
  port: parseInt(url.port),  // 28305
  user: url.username,        // root
  password: url.password,    // BajyCIYofgbNHoljCVADzGvoFekpCwvK
  database: url.pathname.substring(1), // railway
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }, // ⚠️ IMPORTANT
  connectTimeout: 60000
});

// Test connection
pool.getConnection()
  .then((connection) => {
    console.log('🎉 DATABASE CONNECTED SUCCESSFULLY!');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname.substring(1));
    
    // Test query
    return connection.query('SELECT 1 as test_value, NOW() as current_time, VERSION() as version')
      .then(([results]) => {
        console.log('✅ Database test query successful:', results);
        connection.release();
      });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:');
    console.error('   Error:', err.message);
    console.error('   Code:', err.code);
    console.error('   Host:', url.hostname);
    console.error('   Port:', url.port);
  });

/**
 * Jalankan migrasi dari file SQL
 */
export async function runMigrations(sqlFilePath?: string) {
  const defaultPath = path.resolve(process.cwd(), 'config', 'database.schema.sql');
  const sqlPath = sqlFilePath || defaultPath;

  try {
    console.log(`📦 Loading SQL file from: ${sqlPath}`);
    const sql = await fs.readFile(sqlPath, 'utf8');
    const cleanedSql = sql.replace(/^\uFEFF/, '');

    const conn = await pool.getConnection();
    try {
      console.log('🚀 Executing migration...');
      await conn.query(cleanedSql);
      console.log('✅ Migration executed successfully');
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error('❌ Migration failed:', err?.message || err);
    throw err;
  }
}

/**
 * Opsional: jalankan otomatis jika DB_MIGRATE=true
 */
if ((process.env.DB_MIGRATE || '').toLowerCase() === 'true') {
  console.log('🔄 Auto-migration enabled');
  runMigrations().catch(() => {
    console.log('⚠️ Auto-migration failed, continuing without migration');
  });
}

export default pool;