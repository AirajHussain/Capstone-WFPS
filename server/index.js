// this is for DB credentials
require('dotenv').config();

// gets correct modules for project
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const moment = require("moment");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS and JSON parsing 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting up MYSQL DB stuff
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Connecting to the database
db.connect(err => {
    if (err) {
        console.error('Database Connection Error:', err);
        process.exit(1); // ❌ Stop server if DB fails to connect
    }
    console.log('Connected to wildfireDB (sensor_readings table)');
});


// calculating FWI 
function calculateFWI(temperature, humidity, soil_moisture) {
    
    // FFMC: Fine Fuel Moisture Code
    const FFMC = 59.5 * (1 - Math.exp(-0.1386 * soil_moisture));

    // DMC: Duff Moisture Code
    const DMC = (0.5 + 0.3 * Math.exp(-0.136 * temperature)) * (100 - humidity);

    // FWI: Fire Weather Index formula
    const FWI = (DMC * FFMC) / 100;

    return parseFloat(FWI.toFixed(2)); // Round result to 2 decimal places
}


// POST endpoint to get data from arduino through the ESP32
app.post('/add-sensor-reading', (req, res) => {
    const { node_id, temperature, humidity, pressure, soil_moisture_percent } = req.body;

    // Logging to see if there re errors
    console.log(`✅ Received Data: { 
        node_id: ${node_id}, 
        temperature: ${temperature}, 
        humidity: ${humidity}, 
        pressure: ${pressure}, 
        soil_moisture_percent: ${soil_moisture_percent} 
    }`);


    // An error is sent on the server if there is any data issues, as in if the something doesn't come throguh 
    if (!node_id || temperature === undefined || humidity === undefined || pressure === undefined || soil_moisture_percent === undefined) {
        console.error("❌ Missing required sensor data:", req.body);
        return res.status(400).json({ error: 'Missing required sensor data' });
    }


    // Calculate the FWI and store it in fwi
    const fwi = calculateFWI(temperature, humidity, soil_moisture_percent);

    // Count using a db query to see how many is stored within a specific hour 
    const countQuery = `
        SELECT COUNT(*) AS count 
        FROM sensor_readings 
        WHERE node_id = ? 
        AND recorded_at >= DATE_FORMAT(NOW(), '%Y-%m-%d %H:00:00')
        AND recorded_at < DATE_FORMAT(NOW() + INTERVAL 1 HOUR, '%Y-%m-%d %H:00:00');
    `;

    db.query(countQuery, [node_id], (err, results) => {
        if (err) {
            console.error("❌ Error checking count:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        const currentCount = results[0].count;

        // so if it is greater than 15 ignore the storage
        if (currentCount >= 15) {
            console.log(` Skipping storage for Node ${node_id} - Already stored 15 readings this hour`);
            return res.json({ message: ` Data ignored for Node ${node_id} - Max 15 readings reached for this hour.` });
        }

        // ✅ If under limit, prepare reading object
        const readings = JSON.stringify({
            temperature,
            humidity,
            pressure,
            soil_moisture_percent,
        });

        // 🧾 Insert reading into the database
        const insertQuery = `INSERT INTO sensor_readings (node_id, readings, fwi, recorded_at) VALUES (?, ?, ?, NOW())`;

        db.query(insertQuery, [node_id, readings, fwi], (insertErr, result) => {
            if (insertErr) {
                console.error("❌ Error inserting sensor data:", insertErr);
                return res.status(500).json({ error: "Database insertion error" });
            }

            console.log(`✅ Stored Sensor Data for Node ${node_id} at ${moment().format("YYYY-MM-DD HH:mm:ss")}`);
            res.json({ message: "Sensor data stored successfully!", fwi });
        });
    });
});


// Get endpoint to fetch the lat and long of the sensors to display on map
app.get('/sensors', (req, res) => {
    const query = `SELECT node_id, latitude, longitude FROM sensors`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error fetching sensor locations:", err);
            return res.status(500).json({ error: "Database query error" });
        }

        res.json(results); // ✅ Return all node locations as JSON
    });
});

// Get endpoint to fetch sensor readings grouped by their batch time which is every hour 
app.get('/sensor-readings', (req, res) => {
    const query = `
        SELECT node_id, readings, fwi, recorded_at, 
               DATE_FORMAT(recorded_at, '%Y-%m-%d %H:00:00') AS batch_time
        FROM sensor_readings
        ORDER BY recorded_at DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching sensor readings:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        const groupedByBatch = {};

        // Results are grouped by the hour, and their node
        results.forEach(reading => {
            const batchTime = reading.batch_time;
            const nodeId = reading.node_id;

            // If batch doesn't exist, create it
            if (!groupedByBatch[batchTime]) {
                groupedByBatch[batchTime] = {};
            }

            // If node doesn't exist in batch, create it
            if (!groupedByBatch[batchTime][nodeId]) {
                groupedByBatch[batchTime][nodeId] = [];
            }

            // ✅ Parse readings JSON safely
            let sensorData;
            try {
                sensorData = typeof reading.readings === "string" 
                    ? JSON.parse(reading.readings) 
                    : reading.readings;
            } catch (error) {
                console.error("❌ Error parsing JSON readings:", error);
                return;
            }

            // Pushing the data to the correct group
            groupedByBatch[batchTime][nodeId].push({
                temperature: sensorData.temperature || "N/A",
                humidity: sensorData.humidity || "N/A",
                soil_moisture_percent: sensorData.soil_moisture_percent || sensorData.soil_moisture || "N/A",
                pressure: sensorData.pressure || "N/A",
                fwi: reading.fwi || "N/A",
                recorded_at: reading.recorded_at
            });
        });

        res.json(groupedByBatch); // ✅ Return grouped data
    });
});


// 🕒 GET endpoint to fetch historical readings from backup table
app.get('/sensor-history', (req, res) => {
    const query = `SELECT * FROM sensor_readings_history ORDER BY batch_time DESC LIMIT 5`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching historical data:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results); // ✅ Return last 5 batches of history
    });
});


// Starting the server at a specific port
app.listen(PORT, '0.0.0.0', () => {
    console.log(` Server running on http://15.223.86.129:${PORT}`);
});

// The root endpoint of the back end, with instructions to get to other
app.get('/', (req, res) => {
    res.json({
        message: " Wildfire Prediction System API is Running! ",
        endpoints: {
            add_sensor_reading: "/add-sensor-reading (POST)",
            get_sensor_readings: "/sensor-readings (GET)",
            get_sensor_history: "/sensor-history (GET)"
        }
    });
});
