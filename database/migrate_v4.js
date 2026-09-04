require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function migrate() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  };
  if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = { rejectUnauthorized: true };
  }
  const pool = mysql.createPool(dbConfig);

  try {
    console.log('1. Creating deal_products table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS deal_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deal_id INT NOT NULL,
        product_id INT NOT NULL,
        price DECIMAL(15,0) DEFAULT 0,
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('2. Migrating existing products to deal_products...');
    // Only migrate deals that have a product_id
    const [deals] = await pool.execute('SELECT id, product_id, estimated_value FROM deals WHERE product_id IS NOT NULL');
    
    for (const d of deals) {
      // Check if already migrated
      const [existing] = await pool.execute('SELECT * FROM deal_products WHERE deal_id = ? AND product_id = ?', [d.id, d.product_id]);
      if (existing.length === 0) {
        await pool.execute('INSERT INTO deal_products (deal_id, product_id, price) VALUES (?, ?, ?)', [d.id, d.product_id, d.estimated_value]);
      }
    }
    console.log(`Migrated ${deals.length} deals.`);

    console.log('3. Modifying schema: We will NOT drop product_id immediately to be safe, but API will stop using it.');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
