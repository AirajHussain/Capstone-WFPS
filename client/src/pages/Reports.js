import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Navbar from "../components/Navbar";
import "./Reports.css"; // ✅ Import custom CSS for styling

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Reports() {
  const [sensorReadings, setSensorReadings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(""); // ✅ Stores selected batch time

  const API_URL = "http://15.223.86.129:5000/sensor-readings"; // ✅ Backend API

  useEffect(() => {
    axios
      .get(API_URL)
      .then((response) => {
        console.log("API Response:", response.data); // Debugging log

        // ✅ Get batch times and set the latest one as default
        const availableBatches = Object.keys(response.data).sort((a, b) => new Date(b) - new Date(a));
        if (availableBatches.length > 0) {
          setSelectedBatch(availableBatches[0]); // ✅ Default to latest batch
        }

        setSensorReadings(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to load chart data. Please try again later.");
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="loading-container"><p>📡 Loading chart data...</p></div>;
  if (error)
    return <div className="error-container"><p>⚠️ {error}</p></div>;
  if (!sensorReadings || Object.keys(sensorReadings).length === 0)
    return <div className="error-container"><p>⚠️ No data available.</p></div>;

  // ✅ Create chart data function
  const createChartData = (label, data, color) => {
    // ✅ Sort data by recorded_at in ASCENDING order before mapping
    const sortedData = data.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  
    return {
      labels: sortedData.map((entry) =>
        new Date(entry.recorded_at).toLocaleTimeString("en-US", { timeZone: "America/Toronto" })
      ),
      datasets: [
        {
          label: label,
          data: sortedData.map((entry) => entry.value),
          borderColor: color,
          backgroundColor: color + "20",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  };
  

  return (
    <div className="reports-container">
      <Navbar />
      <h1 className="reports-title">📊 Batched Charts of System Sensor Data</h1>
      <p className="subtitle">Node batch time displayed in (EST</p>

      {/* ✅ Batch Selection Dropdown */}
      <div className="dropdown-wrapper">
  <label>Select Batch Time:</label>
  <select 
    value={selectedBatch || ""}
    onChange={(e) => setSelectedBatch(e.target.value)}
  >
    {Object.keys(sensorReadings).sort((a, b) => new Date(b) - new Date(a)).map(batchTime => (
      <option key={batchTime} value={batchTime}>
        {new Date(batchTime).toLocaleString("en-US", { timeZone: "America/Toronto", hour12: true })}
      </option>
    ))}
  </select>
</div>

      {/* ✅ Display charts per node for selected batch */}
      {selectedBatch && sensorReadings[selectedBatch] &&
        Object.keys(sensorReadings[selectedBatch]).map(node_id => (
          <div key={node_id} className="node-reports">
            <h2>Node {node_id}</h2>
            <div className="chart-grid">
              
              {/* 🔥 Fire Weather Index (FWI) */}
              <div className="chart-card">
                <h3>🔥 Fire Weather Index (FWI)</h3>
                <Line data={createChartData("FWI", sensorReadings[selectedBatch][node_id].map(r => ({ value: r.fwi, recorded_at: r.recorded_at })), "rgb(255, 87, 34)")} />
              </div>

              {/* 🌡️ Temperature */}
              <div className="chart-card">
                <h3>🌡️ Temperature (°C)</h3>
                <Line data={createChartData("Temperature", sensorReadings[selectedBatch][node_id].map(r => ({ value: r.temperature, recorded_at: r.recorded_at })), "rgb(244, 67, 54)")} />
              </div>

              {/* 💧 Humidity */}
              <div className="chart-card">
                <h3>💧 Humidity (%)</h3>
                <Line data={createChartData("Humidity", sensorReadings[selectedBatch][node_id].map(r => ({ value: r.humidity, recorded_at: r.recorded_at })), "rgb(33, 150, 243)")} />
              </div>

              {/* 🌱 Soil Moisture */}
              <div className="chart-card">
                <h3>🌱 Soil Moisture (%)</h3>
                <Line data={createChartData("Soil Moisture", sensorReadings[selectedBatch][node_id].map(r => ({ value: r.soil_moisture_percent, recorded_at: r.recorded_at })), "rgb(76, 175, 80)")} />
              </div>

              {/* 🌪️ Air Pressure */}
              <div className="chart-card">
                <h3>🌪️ Air Pressure (hPa)</h3>
                <Line data={createChartData("Air Pressure", sensorReadings[selectedBatch][node_id].map(r => ({ value: r.pressure, recorded_at: r.recorded_at })), "rgb(123, 31, 162)")} />
              </div>

            </div>
          </div>
        ))
      }
    </div>
  );
}

export default Reports;
