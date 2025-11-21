// config/database.ts - MINIMAL VERSION
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔗 Setting up database connection...');

// Gunakan MYSQL_PUBLIC_URL
const connectionString = process.env.MYSQL_PUBLIC_URL || 'mysql://root:BajyCIYofgbNHoljCVADzGvoFekpCwvK@maglev.proxy.rlwy.net:28305/railway';

const url = new URL(connectionString);

console.log('✅ Database config:', {
  host: url.hostname,
  port: url.port,
  user: url.username,
  database: url.pathname.substring(1)
});

// Pool configuration yang sederhana dan valid
const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(() => {
    console.log('🎉 Database connected successfully!');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

export default pool;