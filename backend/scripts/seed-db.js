const fs = require("fs");
const path = require("path");
const sql = require("mssql");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { baseConfig } = require("../src/config/database");
function batches(t) {
  return t
    .replace(/\r/g, "")
    .split(/^\s*GO\s*$/gim)
    .map((x) => x.trim())
    .filter(Boolean);
}
(async () => {
  let p;
  try {
    p = await new sql.ConnectionPool({
      ...baseConfig,
      database: process.env.DB_DATABASE || "DopTechDB",
    }).connect();
    const text = fs.readFileSync(
      path.join(__dirname, "..", "database", "seed.sql"),
      "utf8",
    );
    for (const b of batches(text)) {
      if (!/^USE\s+/i.test(b)) await p.request().batch(b);
    }
    console.log("✅ Seed hoàn tất");
  } catch (e) {
    console.error("❌ Seed lỗi:", e.message);
    process.exitCode = 1;
  } finally {
    if (p) await p.close().catch(() => {});
  }
})();
