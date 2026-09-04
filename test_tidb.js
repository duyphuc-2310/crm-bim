const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2XnBEggTamF4M4V.root',
    password: 'I8HMdfEKXfn2yc8O',
    database: 'crm_bim',
    ssl: { rejectUnauthorized: true }
  });

  const tests = [
    ["settings", "SELECT value FROM settings WHERE `key`='monthly_target'"],
    ["byStage", "SELECT stage, COUNT(*) as count FROM deals WHERE status='open' GROUP BY stage"],
    ["DATE_FORMAT", "SELECT DATE_FORMAT(updated_at,'%Y-%m') as month FROM deals LIMIT 1"],
    ["followups", "SELECT COUNT(*) as count FROM followups WHERE status='overdue'"],
    ["silent", "SELECT d.id, DATEDIFF(CURDATE(), d.created_at) as days_silent FROM deals d WHERE d.status='open' LIMIT 1"],
    ["wonlost", "SELECT SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won FROM deals WHERE MONTH(updated_at)=MONTH(CURDATE())"],
  ];

  for (const [name, sql] of tests) {
    try {
      await conn.query(sql);
      console.log(`✅ ${name}: OK`);
    } catch(e) {
      console.error(`❌ ${name}: ${e.message}`);
    }
  }

  await conn.end();
}

test().catch(e => console.error('Fatal:', e.message));
