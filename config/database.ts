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

// Fungsi yang lebih sederhana dan robust
async function initializeDatabase() {
  const conn = await pool.getConnection();
  try {
    console.log('\n🔧 Initializing database...');

    // Cek dulu apakah tabel users sudah ada
    const [tables] = await conn.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [url.pathname.substring(1)]);

    if ((tables as any).length === 0) {
      console.log('📋 Creating users table...');
      
      // Buat tabel users dengan syntax yang sangat sederhana
      await conn.query(`
        CREATE TABLE users (
          id INT NOT NULL AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY (email)
        )
      `);
      console.log('✅ Users table created successfully!');

      // Insert admin user
      console.log('👤 Creating admin user...');
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
      console.log('✅ Users table already exists');
    }

    // Test insert untuk memastikan AUTO_INCREMENT bekerja
    console.log('🧪 Testing user insertion...');
    try {
      const [result] = await conn.query(`
        INSERT INTO users (name, email, password) 
        VALUES (?, ?, ?)
      `, ['Test User', 'test@example.com', '$2a$10$test']);
      console.log('✅ User insertion test successful');
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('✅ User insertion test (duplicate email expected)');
      } else {
        console.log('⚠️ User insertion test:', error.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
  } finally {
    conn.release();
  }
}

// Handle connection dan initialization
pool.getConnection()
  .then(async (connection) => {
    console.log('🎉 Database connected successfully!');
    
    await initializeDatabase();
    
    connection.release();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });



export default pool;