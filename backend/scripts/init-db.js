const fs = require("fs");
const path = require("path");
const sql = require("mssql");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { baseConfig } = require("../src/config/database");
const dbName = process.env.DB_DATABASE || "DopTechDB";
function batches(text) {
  return text
    .replace(/\r/g, "")
    .split(/^\s*GO\s*$/gim)
    .map((x) => x.trim())
    .filter(Boolean);
}
async function main() {
  let master, target;
  try {
    console.log("⏳ DopTech DB: kết nối SQL Server...");
    master = await new sql.ConnectionPool({
      ...baseConfig,
      database: "master",
    }).connect();
    const exists = (
      await master
        .request()
        .input("db", sql.NVarChar(128), dbName)
        .query("SELECT DB_ID(@db) id")
    ).recordset[0].id;
    if (!exists) {
      console.log(`📦 Tạo database ${dbName}...`);
      await master
        .request()
        .query(`CREATE DATABASE [${dbName.replace(/]/g, "]]")}]`);
    } else
      console.log(`✅ Database ${dbName} đã tồn tại, sẽ reset schema demo.`);
    await master.close();
    master = null;
    target = await new sql.ConnectionPool({
      ...baseConfig,
      database: dbName,
    }).connect();
    const schema = fs.readFileSync(
      path.join(__dirname, "..", "database", "schema.sql"),
      "utf8",
    );
    console.log("🧱 Tạo schema...");
    for (const b of batches(schema)) {
      if (/^IF DB_ID/i.test(b) || /^USE\s+/i.test(b)) continue;
      await target.request().batch(b);
    }
    const seed = fs.readFileSync(
      path.join(__dirname, "..", "database", "seed.sql"),
      "utf8",
    );
    console.log("🌱 Nạp seed data...");
    for (const b of batches(seed)) {
      if (/^USE\s+/i.test(b)) continue;
      await target.request().batch(b);
    }
    const c = (
      await target.request().query("SELECT COUNT(*) Products FROM Products")
    ).recordset[0].Products;
    console.log(`✅ Hoàn tất. Products: ${c}`);
    console.log("🔐 Demo: admin@doptech.local / Admin@123");
    console.log("🔐 Demo: staff@doptech.local / Staff@123");
    console.log("🔐 Demo: customer@doptech.local / Customer@123");
  } catch (e) {
    console.error("❌ Khởi tạo DB thất bại:", e.message);
    console.error(
      "Gợi ý: kiểm tra TCP/IP, SQL Server Browser, SQL Authentication, DB_SERVER/DB_INSTANCE/DB_USER/DB_PASSWORD.",
    );
    process.exitCode = 1;
  } finally {
    if (master) await master.close().catch(() => {});
    if (target) await target.close().catch(() => {});
  }
}
main();
