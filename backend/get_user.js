import db from "./src/lib/db.js";

async function run() {
  try {
    const [tables] = await db.query("SHOW TABLES");
    console.log("Tables:", tables.map(t => Object.values(t)[0]));
    
    // Find table name containing 'user'
    let userTable = tables.map(t => Object.values(t)[0]).find(t => t.toLowerCase().includes('user') || t.toLowerCase().includes('auth') || t.toLowerCase().includes('account'));
    
    if (!userTable) {
        console.log("No user/auth table found. Retrieving all rows from all tables just in case...");
        for (let t of tables.map(t => Object.values(t)[0])) {
            try {
                const [rows] = await db.query(`SELECT * FROM ${t} WHERE email LIKE '%mnrega%'`);
                if (rows.length > 0) {
                    console.log(`Found in table ${t}:`, rows);
                }
            } catch(e) {}
        }
    } else {
        console.log("Querying primary user table:", userTable);
        const [rows] = await db.query(`SELECT * FROM ${userTable} WHERE email LIKE '%mnrega%' OR email LIKE '%masterdashboard%'`);
        console.log("User record:", rows);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
