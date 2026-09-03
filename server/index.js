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

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 CRM BIM Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 phpMyAdmin: http://localhost/phpmyadmin`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'crm_bim'}\n`);
});

module.exports = app;
