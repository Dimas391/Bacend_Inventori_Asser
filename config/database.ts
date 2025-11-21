// config/database.ts - FIXED VERSION
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

console.log('🔍 Database Configuration:');
console.log('   MYSQL_URL:', process.env.MYSQL_URL ? '***' : 'Not set');

// Gunakan MYSQL_URL dari environment variables
const connectionString = process.env.MYSQL_URL || 'mysql://root:ztRelPVAzBCVGaROfEivGWvMphIMWZWd@mysql.railway.internal:3306/railway';

console.log('🔗 Parsing connection string...');

// Parse MYSQL_URL
const url = new URL(connectionString);

const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1), // Remove leading slash
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  ssl: { rejectUnauthorized: false }, // ⚠️ IMPORTANT for Railway
  connectTimeout: 60000 // Hanya connectTimeout yang valid
  // HAPUS: acquireTimeout dan timeout (tidak valid di mysql2)
});

console.log('✅ Database pool created with config:', {
  host: url.hostname,
  port: url.port,
  user: url.username,
  database: url.pathname.substring(1)
});

// Test connection dengan better logging
pool.getConnection()
  .then((connection) => {
    console.log('✅ Database connected successfully!');
    
    // Test query
    return connection.query('SELECT 1 as test_value, NOW() as current_time')
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