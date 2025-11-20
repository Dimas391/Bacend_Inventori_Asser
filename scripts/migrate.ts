import { runMigrations } from '../config/database';
import path from 'path';

async function main() {
  try {
    console.log(' Starting database migration...');
    
    // Tentukan path yang benar ke file SQL
    const sqlPath = path.resolve(__dirname, '../config/database.schema.sql');
    console.log(` SQL file path: ${sqlPath}`);
    
    await runMigrations(sqlPath);
    console.log(' Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(' Migration failed:', error);
    process.exit(1);
  }
}

main();