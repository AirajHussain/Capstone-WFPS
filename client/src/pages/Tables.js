import React, { useState, useEffect } from "react";
import "./Tables.css";
import Navbar from "../components/Navbar";

function Tables() {
  const [sensorReadings, setSensorReadings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState("");

  useEffect(() => {
    fetch("http://15.223.86.129:5000/sensor-readings")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch sensor readings");
        }
        return response.json();
      })
      .then((data) => {
        const availableBatches = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));
        if (availableBatches.length > 0) {
          setSelectedBatch(availableBatches[0]);
        }
        setSensorReadings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Navbar />
      <div className="tables-container">
      <h1 className="title"> 📋 Batched Tables of System Sensor Data</h1>
<p className="subtitle">Node batch time displayed in (EST)</p>

{/* ✅ FWI Risk Legend (Higher up, under subtitle) */}
<div className="legend">
  <h4> FWI Risk Levels</h4>
  <div className="legend-item"><span className="legend-color very-low-risk"></span> Very Low (0–10)</div>
  <div className="legend-item"><span className="legend-color low-risk"></span> Low (10–20)</div>
  <div className="legend-item"><span className="legend-color moderate-risk"></span> Moderate (20–30)</div>
  <div className="legend-item"><span className="legend-color high-risk"></span> High (30–45)</div>
  <div className="legend-item"><span className="legend-color extreme-risk"></span> Extreme (45+)</div>
</div>


        {loading ? (
          <p>Loading sensor data...</p>
        ) : error ? (
          <p className="error">Error: {error}</p>
        ) : (
          <>
            <label className="dropdown-label">Select Batch Time:</label>
            <select 
              className="batch-select"
              value={selectedBatch || ""}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {Object.keys(sensorReadings).sort((a, b) => new Date(b) - new Date(a)).map(batchTime => (
                <option key={batchTime} value={batchTime}>
                  {new Date(batchTime).toLocaleString("en-US", {
                    timeZone: "America/Toronto",
                    hour12: true,
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </option>
              ))}
            </select>

            {selectedBatch && sensorReadings[selectedBatch] &&
              Object.keys(sensorReadings[selectedBatch]).map(node_id => (
                <div key={node_id} className="node-table fade-in">
                  <h2>Node {node_id}</h2>
                  {sensorReadings[selectedBatch][node_id].length === 0 ? (
                    <p>No data available for this node at this time.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="sensor-table">
                        <thead>
                          <tr>
                            <th>Temperature (°C)</th>
                            <th>Humidity (%)</th>
                            <th>Soil Moisture (%)</th>
                            <th>Pressure (hPa)</th>
                            <th>FWI</th>  
                            <th>Recorded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sensorReadings[selectedBatch][node_id].map((reading, index) => (
                            <tr key={index}>
                              <td>{reading.temperature}</td>
                              <td>{reading.humidity}</td>
                              <td>{reading.soil_moisture_percent}</td>
                              <td>{reading.pressure}</td>
                              <td>
                                <span 
                                  className={`fwi-badge ${
                                    reading.fwi > 45 ? "extreme-risk" :
                                    reading.fwi > 30 ? "high-risk" :
                                    reading.fwi > 20 ? "moderate-risk" :
                                    reading.fwi > 10 ? "low-risk" :
                                                      "very-low-risk"
                                  }`}
                                >
                                  {typeof reading.fwi === "number" ? reading.fwi.toFixed(2) : "N/A"}
                                </span>
                              </td>
                              <td>
                                {new Date(reading.recorded_at).toLocaleString("en-US", {
                                  timeZone: "America/Toronto",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  );
}

export default Tables;
