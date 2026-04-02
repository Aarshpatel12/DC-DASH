import mysql from "mysql2/promise";

async function run() {
  try {
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "dc"
    });
    
    const [rows] = await db.query(`SELECT Email, password FROM role WHERE Email = 'mnrega@masterdashboard.gov'`);
    console.log("User record found:", rows);
    
    if (rows.length === 0) {
      const [allRows] = await db.query(`SELECT Email, password FROM role`);
      console.log("All users in role table:");
      console.log(allRows);
    }
  } catch (err) {
    console.error("Error connecting to MySQL:", err.message);
  } finally {
    process.exit(0);
  }
}
run();
