const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT `key`, `value` FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT update a setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    await db.execute(
      'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      [key, value, value]
    );
    res.json({ success: true, data: { key, value } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
