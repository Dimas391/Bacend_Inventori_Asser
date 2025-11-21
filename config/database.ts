import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.MYSQL_PUBLIC_URL || 'mysql://root:ztRelPVAzBCVGaROfEivGWvMphIMWZWd@hopper.proxy.rlwy.net:41017/railway';
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
});

// RECREATE ALL TABLES dengan AUTO_INCREMENT
(async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 RECREATING ALL DATABASE TABLES...');

    // 1. Activity Log table
    await conn.query('DROP TABLE IF EXISTS activity_log');
    await conn.query(`
      CREATE TABLE activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ activity_log table created');

    // 2. Users table  
    await conn.query('DROP TABLE IF EXISTS users');
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
    console.log('✅ users table created');

    // 3. Insert admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await conn.query(`
      INSERT INTO users (name, email, password, role, email_verified, status) 
      VALUES ('Administrator', 'admin@example.com', ?, 'Admin', TRUE, 'Active')
    `, [hashedPassword]);
    console.log('✅ admin user created');

    // 4. Create other tables...
    await conn.query('DROP TABLE IF EXISTS assets');
    await conn.query(`
      CREATE TABLE assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
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
        created_by INT
      )
    `);
    console.log('✅ assets table created');

    console.log('🎉 ALL TABLES RECREATED SUCCESSFULLY!');

  } catch (error: any) {
    console.error('❌ Error recreating tables:', error.message);
  } finally {
    conn.release();
  }
})();

export default pool;