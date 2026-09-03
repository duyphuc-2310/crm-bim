const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// GET activities (with optional deal_id / contact_id filter)
router.get('/', async (req, res) => {
  try {
    const { deal_id, contact_id } = req.query;
    let query = `
      SELECT a.*, c.name as contact_name, d.title as deal_title
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
    `;
    const params = [];
    const conditions = [];
    if (deal_id) { conditions.push('a.deal_id = ?'); params.push(deal_id); }
    if (contact_id) { conditions.push('a.contact_id = ?'); params.push(contact_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.activity_date DESC LIMIT 50';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST create activity (supports file upload via multipart/form-data)
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { deal_id, contact_id, activity_type, activity_date, content, result } = req.body;
    let attachment_url = null;
    if (req.file) {
      attachment_url = '/uploads/' + req.file.filename;
    }

    if (!contact_id || !content) return res.status(400).json({ success: false, error: 'Thiếu thông tin' });
    const [r] = await db.execute(
      'INSERT INTO activities (deal_id, contact_id, activity_type, activity_date, content, result, attachment_url) VALUES (?,?,?,?,?,?,?)',
      [deal_id||null, contact_id, activity_type||'khac', activity_date||new Date(), content, result||'', attachment_url]
    );
    // Update deal's updated_at
    if (deal_id) await db.execute('UPDATE deals SET updated_at=NOW() WHERE id=?', [deal_id]);
    const [rows] = await db.execute(`
      SELECT a.*, c.name as contact_name, d.title as deal_title
      FROM activities a LEFT JOIN contacts c ON a.contact_id=c.id LEFT JOIN deals d ON a.deal_id=d.id
      WHERE a.id=?
    `, [r.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE activity
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM activities WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa hoạt động' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
