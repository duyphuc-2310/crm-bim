const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all contacts with search & filter
router.get('/', async (req, res) => {
  try {
    const { search, org_type, bim_maturity } = req.query;
    let query = `
      SELECT c.*, 
        COUNT(DISTINCT d.id) as deal_count,
        COUNT(DISTINCT a.id) as activity_count
      FROM contacts c
      LEFT JOIN deals d ON c.id = d.contact_id AND d.status = 'open'
      LEFT JOIN activities a ON c.id = a.contact_id
    `;
    const params = [];
    const conditions = [];
    if (search) {
      conditions.push('(c.name LIKE ? OR c.company LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (org_type) { conditions.push('c.org_type = ?'); params.push(org_type); }
    if (bim_maturity) { conditions.push('c.bim_maturity = ?'); params.push(bim_maturity); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY c.id ORDER BY c.updated_at DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET single contact with full 360° overview
router.get('/:id', async (req, res) => {
  try {
    const [contacts] = await db.execute('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    if (!contacts.length) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    const [deals] = await db.execute(`
      SELECT d.*, p.name as product_name FROM deals d 
      LEFT JOIN products p ON d.product_id = p.id 
      WHERE d.contact_id = ? ORDER BY d.updated_at DESC
    `, [req.params.id]);
    const [activities] = await db.execute(`
      SELECT a.*, d.title as deal_title FROM activities a 
      LEFT JOIN deals d ON a.deal_id = d.id 
      WHERE a.contact_id = ? ORDER BY a.activity_date DESC LIMIT 50
    `, [req.params.id]);
    const [followups] = await db.execute(
      "SELECT * FROM followups WHERE contact_id = ? ORDER BY due_date ASC",
      [req.params.id]
    );
    // Revenue summary
    const [revenue] = await db.execute(`
      SELECT 
        SUM(CASE WHEN status='won' THEN estimated_value ELSE 0 END) as total_won,
        COUNT(CASE WHEN status='won' THEN 1 END) as won_count,
        COUNT(CASE WHEN status='open' THEN 1 END) as open_count,
        COUNT(CASE WHEN status='lost' THEN 1 END) as lost_count,
        SUM(CASE WHEN status='open' THEN estimated_value ELSE 0 END) as pipeline_value
      FROM deals WHERE contact_id = ?
    `, [req.params.id]);
    res.json({ success: true, data: { ...contacts[0], deals, activities, followups, revenue: revenue[0] } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


// POST create contact
router.post('/', async (req, res) => {
  try {
    const { name, company, phone, email, org_type, bim_maturity, address, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Tên là bắt buộc' });
    const [result] = await db.execute(
      'INSERT INTO contacts (name, company, phone, email, org_type, bim_maturity, address, notes) VALUES (?,?,?,?,?,?,?,?)',
      [name, company||'', phone||'', email||'', org_type||'khac', bim_maturity||'0_chua_biet', address||'', notes||'']
    );
    const [rows] = await db.execute('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT update contact
router.put('/:id', async (req, res) => {
  try {
    const { name, company, phone, email, org_type, bim_maturity, address, notes } = req.body;
    await db.execute(
      'UPDATE contacts SET name=?, company=?, phone=?, email=?, org_type=?, bim_maturity=?, address=?, notes=? WHERE id=?',
      [name, company||'', phone||'', email||'', org_type||'khac', bim_maturity||'0_chua_biet', address||'', notes||'', req.params.id]
    );
    const [rows] = await db.execute('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE contact
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa khách hàng' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
