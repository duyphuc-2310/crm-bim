const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json({ success: true, data: { contacts: [], deals: [], products: [] } });
    }

    const searchKeyword = `%${q}%`;
    const conn = await db.getConnection();

    try {
      // Search contacts
      const [contacts] = await conn.execute(
        `SELECT id, name, company, phone, email, org_type 
         FROM contacts 
         WHERE name LIKE ? OR company LIKE ? OR phone LIKE ? OR email LIKE ?
         LIMIT 5`,
        [searchKeyword, searchKeyword, searchKeyword, searchKeyword]
      );

      // Search deals (include contact info for context)
      const [deals] = await conn.execute(
        `SELECT d.id, d.title, d.stage, d.status, d.estimated_value, c.name as contact_name
         FROM deals d
         LEFT JOIN contacts c ON d.contact_id = c.id
         WHERE d.title LIKE ? OR c.name LIKE ?
         LIMIT 5`,
        [searchKeyword, searchKeyword]
      );

      // Search products
      const [products] = await conn.execute(
        `SELECT id, name, product_group as category, ref_price as price 
         FROM products 
         WHERE name LIKE ? OR description LIKE ?
         LIMIT 5`,
        [searchKeyword, searchKeyword]
      );

      res.json({
        success: true,
        data: {
          contacts,
          deals,
          products
        }
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
