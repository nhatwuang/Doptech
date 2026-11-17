const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});
const {
  sql,
  baseConfig
} = require('../src/config/database');
async function main() {
  const pool = await new sql.ConnectionPool({
    ...baseConfig,
    database: process.env.DB_DATABASE || 'DopTechDB'
  }).connect();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const dir = path.join(__dirname, '..', 'database', 'migrations');
    for (const file of fs.readdirSync(dir).filter(x => x.endsWith('.sql')).sort()) {
      for (const batch of fs.readFileSync(path.join(dir, file), 'utf8').split(/^\s*GO\s*$/gim).filter(x => x.trim())) await new sql.Request(tx).batch(batch);
    }
    await tx.commit();
    console.log('Migration hoàn tất; dữ liệu hiện có được giữ nguyên.');
  } catch (e) {
    await tx.rollback().catch(() => {});
    throw e;
  } finally {
    await pool.close();
  }
}
main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
