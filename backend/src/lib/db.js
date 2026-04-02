import dotenv from "dotenv";
import mysql from "mysql2";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  


  

  
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log()
    console.error(" MySQL connection failed:");
    console.error("CODE:", err.code);
    console.error("MESSAGE:", err.message);
  } else {
    console.log(" MySQL connected successfully");
    connection.release();
  }
});

export default db.promise();



























// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log(" MongoDB connected successfully");
//   } catch (error) {
//     console.error(" MongoDB connection failed:", error.message);
//     process.exit(1);
//   }
// };

// export default connectDB;