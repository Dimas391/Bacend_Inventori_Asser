import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

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

// Fungsi untuk buat semua tabel
async function createAllTables() {
  const conn = await pool.getConnection();
  try {
    console.log('\n🚀 Creating database tables...');

    // 1. Users table
    console.log('📋 Creating users table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role ENUM('Admin','Moderator','User') DEFAULT 'User',
        status ENUM('Active','Inactive') DEFAULT 'Active',
        department VARCHAR(100),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        token_expiry DATETIME,
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // 2. Assets table
    console.log('📋 Creating assets table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        status ENUM('active','inactive','pending','maintenance') DEFAULT 'active',
        value DECIMAL(10,2) DEFAULT 0.00,
        assigned_to INT,
        location VARCHAR(255),
        purchase_date DATE,
        last_maintenance DATE,
        description TEXT,
        file_path VARCHAR(500),
        file_size BIGINT,
        mime_type VARCHAR(100),
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Assets table created');

    // 3. Device stocks table
    console.log('📋 Creating device_stocks table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS device_stocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        total_stock INT NOT NULL DEFAULT 0,
        available_stock INT NOT NULL DEFAULT 0,
        borrowed_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Device stocks table created');

    // 4. Borrowings table
    console.log('📋 Creating borrowings table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS borrowings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        device_id INT NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        borrow_date DATE NOT NULL,
        return_date DATE NOT NULL,
        status ENUM('borrowed','returned') DEFAULT 'borrowed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES device_stocks(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Borrowings table created');

    // 5. Library items table
    console.log('📋 Creating library_items table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS library_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type ENUM('document','image','video','audio') NOT NULL,
        file_size BIGINT NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100),
        uploaded_by INT NOT NULL,
        description TEXT,
        tags JSON,
        downloads INT DEFAULT 0,
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Library items table created');

    // 6. Activity log table
    console.log('📋 Creating activity_log table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        entity_type ENUM('user','asset','library','system') NOT NULL,
        entity_id INT,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Activity log table created');

    // 7. Chat history table
    console.log('📋 Creating chat_history table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id VARCHAR(100) NOT NULL DEFAULT 'default',
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Chat history table created');

    // 8. Sessions table
    console.log('📋 Creating sessions table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Sessions table created');

    // Insert default admin user
    console.log('👤 Creating default admin user...');
    await conn.query(`
      INSERT IGNORE INTO users (name, email, password, role, email_verified, status) 
      VALUES (?, ?, ?, 'Admin', TRUE, 'Active')
    `, [
      'Administrator',
      'admin@example.com', 
      '$2a$10$8K1p/a0dRTlB0Z6bZ8BwE.O4L3J9KXqVYyQnVYHfL8nWJZ5rVYbXa' // password: admin123
    ]);
    console.log('✅ Default admin user created');

    // Insert sample device stock
    console.log('💻 Creating sample device stock...');
    await conn.query(`
      INSERT IGNORE INTO device_stocks (name, category, total_stock, available_stock) 
      VALUES (?, ?, ?, ?)
    `, ['Laptop Dell', 'Electronics', 5, 5]);
    console.log('✅ Sample device stock created');

    console.log('\n🎉 ALL TABLES CREATED SUCCESSFULLY!');
    console.log('📊 Total tables created: 8 tables');

  } catch (error: any) {
    console.log('⚠️ Table creation error:', error.message);
  } finally {
    conn.release();
  }
}

// Test koneksi dan buat semua tabel
console.log('\n🚀 Testing database connection...');
pool.getConnection()
  .then(async (connection) => {
    console.log('🎉 BERHASIL terhubung ke database!');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname.substring(1));
    
    // Buat semua tabel
    await createAllTables();
    
    connection.release();
  })
  .catch((error) => {
    console.error('❌ GAGAL terhubung ke database:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
  });

export default pool;