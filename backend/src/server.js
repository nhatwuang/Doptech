require("dotenv").config();
require('./config/security').jwtSecret();
const app = require("./app");
const {
  checkDatabase
} = require("./config/database");
const port = Number(process.env.PORT || 4001);
const server = app.listen(port, async () => {
  const db = await checkDatabase();
  console.log("\n=====================================");
  console.log("          DopTech Backend");
  console.log("=====================================");
  console.log(`DopTech API running at http://localhost:${port}`);
  console.log(`SQL Server: ${process.env.DB_SERVER || "localhost"}${process.env.DB_INSTANCE ? "\\" + process.env.DB_INSTANCE : ""}`);
  console.log(`Database: ${process.env.DB_DATABASE || "DopTechDB"}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Database connection: ${db ? "connected" : "disconnected (health API still available)"}`);
  console.log("=====================================\n");
});
server.on("error", e => {
  if (e.code === "EADDRINUSE") console.error(`Port ${port} already in use`);else console.error(e);
});

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// require("dotenv").config();
// const app = require("./app");
// const { checkDatabase } = require("./config/database");
// const port = Number(process.env.PORT || 4001);
// const server = app.listen(port, async () => {
//   const db = await checkDatabase();
//   console.log("\n=====================================");
//   console.log("          DopTech Backend");
//   console.log("=====================================");
//   console.log(`DopTech API running at http://localhost:${port}`);
//   console.log(
//     `SQL Server: ${process.env.DB_SERVER || "localhost"}${process.env.DB_INSTANCE ? "\\" + process.env.DB_INSTANCE : ""}`,
//   );
//   console.log(`Database: ${process.env.DB_DATABASE || "DopTechDB"}`);
//   console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(
//     `Database connection: ${db ? "connected" : "disconnected (health API still available)"}`,
//   );
//   console.log("=====================================\n");
// });
// server.on("error", (e) => {
//   if (e.code === "EADDRINUSE") console.error(`Port ${port} already in use`);
//   else console.error(e);
// });
// 
// ===== HET MA CU =====
