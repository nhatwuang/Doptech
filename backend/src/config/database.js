const sql = require("mssql");
require("dotenv").config();

const baseConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  options: {
    instanceName: process.env.DB_INSTANCE || undefined,
    encrypt: String(process.env.DB_ENCRYPT).toLowerCase() === "true",
    trustServerCertificate:
      String(process.env.DB_TRUST_CERT ?? "true").toLowerCase() === "true",
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let pool;
async function getPool() {
  if (pool?.connected) return pool;
  pool = await new sql.ConnectionPool({
    ...baseConfig,
    database: process.env.DB_DATABASE || "DopTechDB",
  }).connect();
  return pool;
}
async function checkDatabase() {
  try {
    const p = await getPool();
    await p.request().query("SELECT 1 AS ok");
    return true;
  } catch (_) {
    return false;
  }
}
module.exports = { sql, getPool, checkDatabase, baseConfig };
