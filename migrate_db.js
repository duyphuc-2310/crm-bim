const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('Đang kết nối tới TiDB Cloud...');
  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2XnBEggTamF4M4V.root',
    password: 'I8HMdfEKXfn2yc8O',
    ssl: {
      rejectUnauthorized: true
    },
    multipleStatements: true
  });

  console.log('Kết nối thành công! Đang tạo database crm_bim...');
  await connection.query('CREATE DATABASE IF NOT EXISTS crm_bim');
  await connection.query('USE crm_bim');

  console.log('Đang đọc file sql dump...');
  const sql = fs.readFileSync('crm_bim_dump_utf8.sql', 'utf8');

  console.log('Đang import dữ liệu, vui lòng đợi...');
  try {
    await connection.query(sql);
    console.log('✅ Import dữ liệu lên TiDB thành công!');
  } catch (err) {
    console.error('❌ Lỗi import:', err.message);
  }

  await connection.end();
}

migrate();
