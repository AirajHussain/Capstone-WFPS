# Wildfire Prediction System

The Wildfire Prediction System is designed to monitor and predict fire-prone conditions in real-time. Environmental sensor nodes measure temperature, humidity, soil moisture, and pressure. The collected data is transmitted via LoRa communication to an ESP32 gateway, which forwards the data to a Node.js backend server. The backend calculates the Fire Weather Index (FWI) based on the received data and stores the results in a MySQL database. A React.js web application retrieves and displays this information for monitoring and analysis.

## 💻 Technologies Used

- Node.js (Express.js)
- React.js
- MySQL
- ESP32 Microcontroller
- LoRa (SX1278) Communication
- dotenv
- Moment.js

## 📋 Features

- Sensor data collection through STM32/Arduino nodes
- Wireless data transmission using LoRa
- Backend server calculates Fire Weather Index (FWI)
- Storage of real-time and historical data in MySQL
- Frontend dashboard for real-time monitoring and historical analysis
- RESTful API endpoints for sensor readings and historical data retrieval
- Automated data filtering to prevent redundant entries (4-minute minimum interval)

# 📷 Pictures

### Main Page

<div style="display: flex; justify-content: space-around;">
<img src="https://github.com/AirajHussain/Capstone-WFPS/blob/main/images/mainpage.png" alt="login_page" />
</div>

### Reports Page
<div style="display: flex; justify-content: space-around;">
<img src="https://github.com/AirajHussain/Capstone-WFPS/blob/main/images/reportspage.png" alt="login_page" />
</div>

### Tables Page
<div style="display: flex; justify-content: space-around;">
<img src="https://github.com/AirajHussain/Capstone-WFPS/blob/main/images/tablespage.png" alt="login_page" />
</div>

### Mapsview Page
<div style="display: flex; justify-content: space-around;">
<img src="https://github.com/AirajHussain/Capstone-WFPS/blob/main/images/mapviewpage.png" alt="login_page" />
</div>

### About Us Page
<div style="display: flex; justify-content: space-around;">
<img src="https://github.com/AirajHussain/Capstone-WFPS/blob/main/images/aboutuspage.png" alt="login_page" />
</div>

## 🛠️ Project Structure

```
/wildfire-prediction-system
├── server
│   ├── index.js
│   ├── package.json
│   └── .env
├── client
│   ├── src
│   ├── public
│   └── package.json
└── README.md
```

## 🌐 REST API Endpoints

### POST `/add-sensor-reading`

Accepts new sensor data and calculates the FWI.

#### Request Body:
```json
{
  "node_id": "string",
  "temperature": "float",
  "humidity": "float",
  "pressure": "float",
  "soil_moisture_percent": "float"
}
```

### GET `/sensor-readings`

Retrieves the latest grouped sensor readings, organized by hourly batches.

### GET `/sensor-history`

Fetches the most recent historical records from the database.

### GET `/`

Displays available API routes and project status.

## ⚙️ Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/wildfire-prediction-system.git
   ```

2. Navigate to the `server` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

3. Create a `.env` file inside the `server` directory with the following contents:
   ```
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

5. Navigate to the `client` directory and install dependencies:
   ```bash
   cd ../client
   npm install
   ```

6. Start the frontend application:
   ```bash
   npm start
   ```

7. Access the application at:
   ```
   http://localhost:3000
   ```

## 🗄️ Database Schema Overview

### Table: `sensor_readings`

| Column         | Type         | Description                        |
|----------------|--------------|------------------------------------|
| id             | INT (Primary) | Unique identifier                 |
| node_id        | VARCHAR       | Identifier for the sensor node     |
| readings       | JSON          | Sensor values (temperature, humidity, etc.) |
| fwi            | FLOAT         | Calculated Fire Weather Index      |
| recorded_at    | TIMESTAMP     | Time of data recording             |

### Table: `sensor_readings_history`

| Column         | Type         | Description                        |
|----------------|--------------|------------------------------------|
| id             | INT (Primary) | Unique identifier                 |
| batch_time     | TIMESTAMP     | Time group for historical records |
| readings_batch | JSON          | Grouped sensor readings            |

## 📊 Future Enhancements

- Secure authentication for API access
- Admin dashboard for system health monitoring
- Extended historical trend analysis
- Alert system for high FWI values
- Offline data caching for the frontend

## 👥 Contributors

- Syed Airaj Hussain
- Nathan Yohannes
- Mohammed Adnan Hashmi
- Bowei Zhou

