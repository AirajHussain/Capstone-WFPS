require('dotenv').config(); // Load environment variables from .env file
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'fwiUser',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'wildfireDB',
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to the database:', err);
        return;
    }
    console.log('✅ Connected to the database');
});

module.exports = db;

