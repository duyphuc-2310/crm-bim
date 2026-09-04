const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all deals with filters (for kanban or list)
router.get('/', async (req, res) => {
  try {
    const { stage, status, contact_id } = req.query; // Removed product_id filter for now as it requires complex JOIN if needed, or we can implement it using EXISTS
    let query = `
      SELECT d.*, 
        c.name as contact_name, c.company as contact_company, c.phone as contact_phone,
        (SELECT GROUP_CONCAT(p.name SEPARATOR ' + ') FROM deal_products dp JOIN products p ON dp.product_id = p.id WHERE dp.deal_id = d.id) as product_name,
        (SELECT COUNT(*) FROM activities a WHERE a.deal_id = d.id) as activity_count,
        (SELECT COUNT(*) FROM followups f WHERE f.deal_id = d.id AND f.status = 'pending') as pending_followups
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
    `;
    const params = [];
    const conditions = [];
    if (stage) { conditions.push('d.stage = ?'); params.push(stage); }
    if (status) { conditions.push('d.status = ?'); params.push(status); }
    else { conditions.push("d.status = 'open'"); }
    if (contact_id) { conditions.push('d.contact_id = ?'); params.push(contact_id); }
    
    // Support filtering by product_id using EXISTS
    if (req.query.product_id) {
      conditions.push('EXISTS (SELECT 1 FROM deal_products dp WHERE dp.deal_id = d.id AND dp.product_id = ?)');
      params.push(req.query.product_id);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY d.updated_at DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET kanban data (all stages)
router.get('/kanban', async (req, res) => {
  try {
    const stages = [
      { id: 1, name: 'Mới tiếp cận' },
      { id: 2, name: 'Khảo sát nhu cầu' },
      { id: 3, name: 'Đề xuất giải pháp' },
      { id: 4, name: 'Demo / Thử nghiệm' },
      { id: 5, name: 'Gửi báo giá' },
      { id: 6, name: 'Đàm phán' },
      { id: 7, name: 'Chốt / Kết thúc' }
    ];
    const [deals] = await db.execute(`
      SELECT d.*, 
        c.name as contact_name, c.company as contact_company,
        (SELECT GROUP_CONCAT(p.name SEPARATOR ' + ') FROM deal_products dp JOIN products p ON dp.product_id = p.id WHERE dp.deal_id = d.id) as product_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      ORDER BY d.updated_at DESC
    `);
    const kanban = stages.map(s => ({
      ...s,
      deals: deals.filter(d => d.stage === s.id),
      total_value: deals.filter(d => d.stage === s.id && d.status === 'open').reduce((sum, d) => sum + Number(d.estimated_value), 0),
      count: deals.filter(d => d.stage === s.id && d.status === 'open').length
    }));
    res.json({ success: true, data: kanban });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET single deal
router.get('/:id', async (req, res) => {
  try {
    const [deals] = await db.execute(`
      SELECT d.*, c.name as contact_name, c.company as contact_company, c.phone as contact_phone, c.email as contact_email
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.id = ?
    `, [req.params.id]);
    if (!deals.length) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    
    const [products] = await db.execute(`
      SELECT p.id, p.name, dp.price
      FROM deal_products dp
      JOIN products p ON dp.product_id = p.id
      WHERE dp.deal_id = ?
    `, [req.params.id]);

    const [activities] = await db.execute(
      'SELECT * FROM activities WHERE deal_id = ? ORDER BY activity_date DESC',
      [req.params.id]
    );
    const [followups] = await db.execute(
      'SELECT * FROM followups WHERE deal_id = ? ORDER BY due_date ASC',
      [req.params.id]
    );
    res.json({ success: true, data: { ...deals[0], products, activities, followups } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST create deal
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { title, contact_id, products, stage, next_followup_date, probability, notes } = req.body;
    if (!title || !contact_id) return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
    
    // Calculate estimated_value from products array [{id, price}]
    const estimated_value = Array.isArray(products) ? products.reduce((sum, p) => sum + Number(p.price || 0), 0) : 0;

    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO deals (title, contact_id, estimated_value, stage, next_followup_date, probability, notes) VALUES (?,?,?,?,?,?,?)',
      [title, contact_id, estimated_value, stage||1, next_followup_date||null, probability||10, notes||'']
    );
    
    const deal_id = result.insertId;
    if (Array.isArray(products) && products.length > 0) {
      for (const p of products) {
        await conn.execute('INSERT INTO deal_products (deal_id, product_id, price) VALUES (?, ?, ?)', [deal_id, p.id, p.price || 0]);
      }
    }

    if (next_followup_date) {
      await conn.execute(
        'INSERT INTO followups (deal_id, contact_id, due_date, content, priority) VALUES (?,?,?,?,?)',
        [deal_id, contact_id, next_followup_date, `Follow-up deal: ${title}`, 'medium']
      );
    }
    
    await conn.commit();
    res.json({ success: true, id: deal_id });
  } catch (err) { 
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message }); 
  } finally {
    conn.release();
  }
});

// PUT update deal
router.put('/:id', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { title, contact_id, products, stage, status, next_followup_date, probability, notes } = req.body;
    
    const estimated_value = Array.isArray(products) ? products.reduce((sum, p) => sum + Number(p.price || 0), 0) : 0;

    await conn.beginTransaction();
    
    // Nếu status undefined, giữ nguyên status cũ bằng cách COALESCE trong SQL (nhưng MySQL không cho phép COALESCE(?, status) nếu tham số là undefined từ nodejs).
    // Nên lấy deal cũ ra trước hoặc dùng logic js:
    const [existing] = await conn.execute('SELECT status FROM deals WHERE id = ?', [req.params.id]);
    const currentStatus = existing.length ? existing[0].status : 'open';
    const finalStatus = status || currentStatus;

    await conn.execute(
      'UPDATE deals SET title=?, contact_id=?, estimated_value=?, stage=?, status=?, next_followup_date=?, probability=?, notes=? WHERE id=?',
      [title, contact_id, estimated_value, stage||1, finalStatus, next_followup_date||null, probability||10, notes||'', req.params.id]
    );

    if (Array.isArray(products)) {
      await conn.execute('DELETE FROM deal_products WHERE deal_id = ?', [req.params.id]);
      for (const p of products) {
        await conn.execute('INSERT INTO deal_products (deal_id, product_id, price) VALUES (?, ?, ?)', [req.params.id, p.id, p.price || 0]);
      }
    }
    
    await conn.commit();
    res.json({ success: true });
  } catch (err) { 
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message }); 
  } finally {
    conn.release();
  }
});

// PATCH update stage only (for kanban drag)
router.patch('/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    await db.execute('UPDATE deals SET stage=? WHERE id=?', [stage, req.params.id]);
    res.json({ success: true, message: 'Đã cập nhật giai đoạn' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH update status (won/lost)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const stage = status === 'won' ? 7 : (status === 'lost' ? 7 : undefined);
    if (stage) {
      await db.execute('UPDATE deals SET status=?, stage=? WHERE id=?', [status, stage, req.params.id]);
    } else {
      await db.execute('UPDATE deals SET status=? WHERE id=?', [status, req.params.id]);
    }
    res.json({ success: true, message: 'Đã cập nhật trạng thái' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE deal
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM deals WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa deal' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
