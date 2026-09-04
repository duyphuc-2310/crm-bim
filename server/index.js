const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/products', require('./routes/products'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/search', require('./routes/search'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db');
    await db.execute('SELECT 1');
    res.json({ success: true, message: 'CRM BIM API đang chạy!', db: 'Kết nối MySQL thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi kết nối database', error: err.message });
  }
});

// API 404 handler (must be before SPA catch-all)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.path}` });
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Auto Migrate on Startup
async function autoMigrate() {
  try {
    const db = require('./db');
    // Check if deal_products exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'deal_products'");
    if (tables.length === 0) {
      console.log('Migrating: Creating deal_products table...');
      await db.execute(`
        CREATE TABLE deal_products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          deal_id INT NOT NULL,
          product_id INT NOT NULL,
          price DECIMAL(15,0) DEFAULT 0,
          FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      
      console.log('Migrating: Copying existing data...');
      const [deals] = await db.execute('SELECT id, product_id, estimated_value FROM deals WHERE product_id IS NOT NULL');
      for (const d of deals) {
        await db.execute('INSERT INTO deal_products (deal_id, product_id, price) VALUES (?, ?, ?)', [d.id, d.product_id, d.estimated_value]);
      }
      console.log('Migration completed successfully!');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// Start server
app.listen(PORT, async () => {
  await autoMigrate();
  console.log(`\n🚀 CRM BIM Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 phpMyAdmin: http://localhost/phpmyadmin`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'crm_bim'}\n`);
});

module.exports = app;
