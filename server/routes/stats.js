const express = require('express');
const router = express.Router();
const db = require('../db');

// GET dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Total pipeline value
    const [pipeline] = await db.execute(
      "SELECT COUNT(*) as total_deals, SUM(estimated_value) as total_value FROM deals WHERE status='open'"
    );
    // Won/Lost this month
    const [wonlost] = await db.execute(`
      SELECT 
        SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won_count,
        SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost_count,
        SUM(CASE WHEN status='won' THEN estimated_value ELSE 0 END) as won_value
      FROM deals 
      WHERE MONTH(updated_at)=MONTH(CURDATE()) AND YEAR(updated_at)=YEAR(CURDATE())
    `);
    // Deals by stage
    const [byStage] = await db.execute(`
      SELECT stage, COUNT(*) as count, SUM(estimated_value) as value
      FROM deals WHERE status='open'
      GROUP BY stage ORDER BY stage
    `);
    // Overdue followups
    const [overdue] = await db.execute(
      "SELECT COUNT(*) as count FROM followups WHERE status='overdue'"
    );
    // Today followups
    const [today] = await db.execute(
      "SELECT COUNT(*) as count FROM followups WHERE due_date=CURDATE() AND status='pending'"
    );
    // Top deals by value
    const [topDeals] = await db.execute(`
      SELECT d.id, d.title, d.estimated_value, d.stage, d.probability,
        c.name as contact_name, c.company as contact_company, p.name as product_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id=c.id
      LEFT JOIN products p ON d.product_id=p.id
      WHERE d.status='open'
      ORDER BY d.estimated_value DESC
      LIMIT 5
    `);
    // Deals by product
    const [byProduct] = await db.execute(`
      SELECT ANY_VALUE(p.name) as product_name, COUNT(d.id) as deal_count, SUM(d.estimated_value) as total_value
      FROM deals d
      LEFT JOIN products p ON d.product_id=p.id
      WHERE d.status='open'
      GROUP BY d.product_id
      ORDER BY total_value DESC
    `);
    // Recent activities
    const [recentActivities] = await db.execute(`
      SELECT a.*, c.name as contact_name, d.title as deal_title
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id=c.id
      LEFT JOIN deals d ON a.deal_id=d.id
      ORDER BY a.activity_date DESC LIMIT 5
    `);

    // Get Monthly Target
    const [targetRow] = await db.execute("SELECT value FROM settings WHERE `key`='monthly_target'");
    const monthlyTarget = targetRow.length ? Number(targetRow[0].value) : 0;

    res.json({
      success: true,
      data: {
        pipeline: pipeline[0],
        wonlost: wonlost[0],
        byStage,
        overdue: overdue[0].count,
        today_followups: today[0].count,
        topDeals,
        byProduct,
        recentActivities,
        monthlyTarget
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET analytics — revenue by month, conversion rates, top products
router.get('/analytics', async (req, res) => {
  try {
    // Won deals revenue by month (last 12 months)
    const [revenueByMonth] = await db.execute(`
      SELECT 
        DATE_FORMAT(updated_at, '%Y-%m') as month,
        DATE_FORMAT(updated_at, '%m/%Y') as label,
        COUNT(*) as deals_count,
        SUM(estimated_value) as revenue
      FROM deals
      WHERE status='won' AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(updated_at, '%Y-%m'), DATE_FORMAT(updated_at, '%m/%Y')
      ORDER BY month ASC
    `);

    // Stage conversion: deals that reached each stage
    const [stageConversion] = await db.execute(`
      SELECT stage, COUNT(*) as count FROM deals
      WHERE status IN ('open','won')
      GROUP BY stage ORDER BY stage
    `);

    // Top products by revenue
    const [topProducts] = await db.execute(`
      SELECT 
        COALESCE(ANY_VALUE(p.name), 'Không xác định') as product_name,
        ANY_VALUE(p.product_group) as product_group,
        COUNT(d.id) as deals_won,
        SUM(d.estimated_value) as total_revenue
      FROM deals d
      LEFT JOIN products p ON d.product_id = p.id
      WHERE d.status='won'
      GROUP BY d.product_id
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // Monthly target from settings
    const [targetRow] = await db.execute("SELECT value FROM settings WHERE `key`='monthly_target'");
    const monthlyTarget = targetRow.length ? Number(targetRow[0].value) : 0;
    
    // This month won revenue
    const [thisMonth] = await db.execute(`
      SELECT SUM(estimated_value) as revenue, COUNT(*) as count
      FROM deals WHERE status='won'
      AND MONTH(updated_at)=MONTH(CURDATE()) AND YEAR(updated_at)=YEAR(CURDATE())
    `);

    // Activity by type
    const [activityByType] = await db.execute(`
      SELECT activity_type, COUNT(*) as count FROM activities
      WHERE activity_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY activity_type ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        revenueByMonth,
        stageConversion,
        topProducts,
        monthlyTarget,
        thisMonth: thisMonth[0],
        activityByType
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET silent deals — deals with no activity in last N days
router.get('/silent', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const [rows] = await db.execute(`
      SELECT d.id, d.title, d.stage, d.estimated_value, d.updated_at, d.created_at,
        ANY_VALUE(c.name) as contact_name, ANY_VALUE(c.phone) as contact_phone, ANY_VALUE(c.company) as contact_company,
        ANY_VALUE(p.name) as product_name,
        MAX(a.activity_date) as last_activity_date,
        DATEDIFF(CURDATE(), COALESCE(MAX(a.activity_date), d.created_at)) as days_silent
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN activities a ON d.id = a.deal_id
      WHERE d.status = 'open'
      GROUP BY d.id, d.title, d.stage, d.estimated_value, d.updated_at, d.created_at
      HAVING days_silent >= ?
      ORDER BY days_silent DESC
    `, [days]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
