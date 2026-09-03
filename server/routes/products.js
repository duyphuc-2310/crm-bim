const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products ORDER BY product_group, name');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const { name, product_group, ref_price, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Tên sản phẩm là bắt buộc' });
    const [result] = await db.execute(
      'INSERT INTO products (name, product_group, ref_price, description) VALUES (?,?,?,?)',
      [name, product_group||'bim_chu_luc', ref_price||0, description||'']
    );
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { name, product_group, ref_price, description } = req.body;
    await db.execute(
      'UPDATE products SET name=?, product_group=?, ref_price=?, description=? WHERE id=?',
      [name, product_group||'bim_chu_luc', ref_price||0, description||'', req.params.id]
    );
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
