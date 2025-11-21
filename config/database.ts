import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Starting database configuration...');

const manualConnectionString = 'mysql://root:ztRelPVAzBCVGaROfEivGWvMphIMWZWd@hopper.proxy.rlwy.net:41017/railway';
const connectionString = process.env.MYSQL_PUBLIC_URL || manualConnectionString;

console.log('🔗 Using connection string:', connectionString.replace(/:[^:@]+@/, ':***@'));

const url = new URL(connectionString);

const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000
});

async function fixUsersTable() {
  const conn = await pool.getConnection();
  try {
    console.log('\n🔧 Checking users table structure...');

    // Cek struktur tabel users
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, EXTRA 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'
    `, [url.pathname.substring(1)]);

    const idColumn = (columns as any)[0];
    
    if (idColumn && !idColumn.EXTRA.includes('auto_increment')) {
      console.log('⚠️ Users table exists but id column is not AUTO_INCREMENT');
      console.log('🔄 Recreating users table...');
      
      // Backup data jika ada (optional)
      const [existingUsers] = await conn.query('SELECT * FROM users');
      console.log(`📦 Found ${(existingUsers as any).length} existing users`);
      
      // Drop table
      await conn.query('DROP TABLE users');
      console.log('✅ Old users table dropped');
      
      // Create new table dengan AUTO_INCREMENT
      await conn.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          role VARCHAR(20) DEFAULT 'User',
          status VARCHAR(20) DEFAULT 'Active',
          department VARCHAR(100),
          email_verified BOOLEAN DEFAULT FALSE,
          verification_token VARCHAR(255),
          token_expiry DATETIME,
          last_login DATETIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ New users table created with AUTO_INCREMENT');
      
      // Insert admin user
      await conn.query(`
        INSERT INTO users (name, email, password, role, email_verified, status) 
        VALUES (?, ?, ?, 'Admin', TRUE, 'Active')
      `, [
        'Administrator',
        'admin@example.com', 
        '$2a$10$8K1p/a0dRTlB0Z6bZ8BwE.O4L3J9KXqVYyQnVYHfL8nWJZ5rVYbXa'
      ]);
      console.log('✅ Admin user created');
      
    } else {
      console.log('✅ Users table structure is correct');
    }

    // Test insert
    console.log('🧪 Testing user insertion...');
    try {
      const [result] = await conn.query(`
        INSERT INTO users (name, email, password) 
        VALUES (?, ?, ?)
      `, ['Test User', 'test' + Date.now() + '@example.com', '$2a$10$test']);
      console.log('✅ User insertion test successful - AUTO_INCREMENT is working!');
    } catch (error: any) {
      console.log('⚠️ Test insertion:', error.message);
    }

  } catch (error: any) {
    console.error('❌ Error fixing users table:', error.message);
  } finally {
    conn.release();
  }
}

// Initialize
pool.getConnection()
  .then(async (connection) => {
    console.log('🎉 Database connected successfully!');
    await fixUsersTable();
    connection.release();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });

export default pool;