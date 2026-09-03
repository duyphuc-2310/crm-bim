const express = require('express');
const router = express.Router();
const db = require('../db');

// Auto-update overdue status
async function updateOverdue() {
  await db.execute(
    "UPDATE followups SET status='overdue' WHERE due_date < CURDATE() AND status='pending'"
  );
}

// GET followups
router.get('/', async (req, res) => {
  try {
    await updateOverdue();
    const { status, contact_id, deal_id } = req.query;
    let query = `
      SELECT f.*, c.name as contact_name, c.company as contact_company, d.title as deal_title
      FROM followups f
      LEFT JOIN contacts c ON f.contact_id = c.id
      LEFT JOIN deals d ON f.deal_id = d.id
    `;
    const params = [];
    const conditions = [];
    if (status) { conditions.push('f.status = ?'); params.push(status); }
    if (contact_id) { conditions.push('f.contact_id = ?'); params.push(contact_id); }
    if (deal_id) { conditions.push('f.deal_id = ?'); params.push(deal_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY f.due_date ASC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET today + upcoming (dashboard widget)
router.get('/upcoming', async (req, res) => {
  try {
    await updateOverdue();
    const [rows] = await db.execute(`
      SELECT f.*, c.name as contact_name, c.company as contact_company, d.title as deal_title
      FROM followups f
      LEFT JOIN contacts c ON f.contact_id = c.id
      LEFT JOIN deals d ON f.deal_id = d.id
      WHERE f.status != 'done' AND f.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY f.due_date ASC, f.priority DESC
      LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET overdue count (for badge)
router.get('/overdue-count', async (req, res) => {
  try {
    await updateOverdue();
    const [rows] = await db.execute(
      "SELECT COUNT(*) as count FROM followups WHERE status IN ('overdue', 'pending') AND due_date <= CURDATE()"
    );
    res.json({ success: true, count: rows[0].count });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST create followup
router.post('/', async (req, res) => {
  try {
    const { deal_id, contact_id, due_date, content, priority } = req.body;
    if (!contact_id || !due_date || !content) return res.status(400).json({ success: false, error: 'Thiếu thông tin' });
    const [result] = await db.execute(
      'INSERT INTO followups (deal_id, contact_id, due_date, content, priority) VALUES (?,?,?,?,?)',
      [deal_id||null, contact_id, due_date, content, priority||'medium']
    );
    const [rows] = await db.execute(`
      SELECT f.*, c.name as contact_name, d.title as deal_title
      FROM followups f LEFT JOIN contacts c ON f.contact_id=c.id LEFT JOIN deals d ON f.deal_id=d.id
      WHERE f.id=?
    `, [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH mark as done
router.patch('/:id/done', async (req, res) => {
  try {
    await db.execute("UPDATE followups SET status='done' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Đã hoàn thành' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT update followup
router.put('/:id', async (req, res) => {
  try {
    const { due_date, content, status, priority } = req.body;
    await db.execute(
      'UPDATE followups SET due_date=?, content=?, status=?, priority=? WHERE id=?',
      [due_date, content, status||'pending', priority||'medium', req.params.id]
    );
    res.json({ success: true, message: 'Đã cập nhật' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE followup
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM followups WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa nhắc việc' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
