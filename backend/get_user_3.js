import db from "./src/lib/db.js";

async function check() {
  try {
    console.log("Executing query...");
    const [rows] = await db.query("SELECT * FROM role WHERE Email='mnrega@masterdashboard.gov'");
    console.log("\n--- QUERY RESULT ---");
    console.log(rows);
    console.log("--------------------\n");
  } catch (err) {
    console.error("DB QUERY ERROR:", err);
  } finally {
    process.exit(0);
  }
}

setTimeout(check, 1000);
