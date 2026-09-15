require('dotenv').config();
const db = require('./server/db');

async function run() {
  try {
    console.log('Altering contacts table to allow longer phone strings...');
    await db.execute('ALTER TABLE contacts MODIFY phone VARCHAR(150);');
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
