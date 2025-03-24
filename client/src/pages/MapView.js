import React, { useState, useEffect } from "react";
import { GoogleMap, useLoadScript, Circle, InfoWindow } from "@react-google-maps/api";
import "./MapView.css";
import Navbar from "../components/Navbar";

const MAP_API_KEY = "AIzaSyAqTTXohEu6Kri6xyKaXdAQ324TLdmmB18"; // Replace if needed

const MAP_CENTER = { lat: 43.9451, lng: -78.8964 }; // 1760 Simcoe St N, Oshawa
const MAP_ZOOM = 18;

const mapContainerStyle = {
  width: "100%",
  height: "93.9vh",
};

function MapView() {
  const [sensorLocations, setSensorLocations] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSensor, setSelectedSensor] = useState(null);

  /* ✅ Load Google Maps */
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: MAP_API_KEY,
  });

  //Fetching sensors information for locations
  useEffect(() => {
    fetch("http://15.223.86.129:5000/sensors")
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ Sensor Locations:", data);
        setSensorLocations(data);
      })
      .catch((error) => console.error("❌ Error fetching sensor locations:", error));
  }, []);

  //Fetching sensor readings
  useEffect(() => {
    fetch("http://15.223.86.129:5000/sensor-readings")
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ Sensor Readings:", data);
        const availableBatches = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));
        if (availableBatches.length > 0) {
          setSelectedBatch(availableBatches[0]); // Default to latest batch
        }
        setSensorData(data);
      })
      .catch((error) => console.error("❌ Error fetching sensor readings:", error));
  }, []);

  //Determine FWI Risk Color
  const getFWIColor = (fwi) => {
    if (fwi > 45) return "#d32f2f"; // 🔴 Extreme
    if (fwi > 30) return "#fb8c00"; // 🟠 High
    if (fwi > 20) return "#fbc02d"; // 🟡 Moderate
    if (fwi > 10) return "#388e3c"; // 🟢 Low
    return "#1976d2";              // 🔵 Very Low
  };
  

  // if there is a loading map bug
  if (!isLoaded) return <h2 className="loading-text">Loading Map...</h2>;

  return (
    <div>
      <Navbar />
      <div className="map-container">
        <h1 className="map-title">🔥 Fire Risk Map (Batch-Based)</h1>
        
        {/* ✅ Batch Selection Dropdown */}
        <label>Select Batch Time:</label>
        <select 
          value={selectedBatch || ""}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          {Object.keys(sensorData).sort((a, b) => new Date(b) - new Date(a)).map(batchTime => (
            <option key={batchTime} value={batchTime}>
              {new Date(batchTime).toLocaleString("en-US", { timeZone: "America/Toronto", hour12: true })}
            </option>
          ))}
        </select>

        {/* ✅ Google Map */}
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          options={{ disableDefaultUI: true, draggable: false, zoomControl: false }}
        >
          {/* 🔥 Render Circles Using Database Locations */}
          {selectedBatch && sensorData[selectedBatch] &&
            sensorLocations.map((sensor) => {
              const nodeId = sensor.node_id;
              const readings = sensorData[selectedBatch][nodeId];

              if (!readings || readings.length === 0) {
                console.warn(`⚠️ No readings found for Node ${nodeId} in batch ${selectedBatch}`);
                return null; // Skip if no readings for this node in the selected batch
              }

              return (
                <Circle
                  key={nodeId}
                  center={{ lat: parseFloat(sensor.latitude), lng: parseFloat(sensor.longitude) }}
                  radius={20}
                  options={{
                    fillColor: getFWIColor(readings[0].fwi),
                    fillOpacity: 0.6,
                    strokeColor: getFWIColor(readings[0].fwi),
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                  }}
                  onMouseOver={() => setSelectedSensor({ ...readings[0], node_id:nodeId,position: { lat: parseFloat(sensor.latitude), lng: parseFloat(sensor.longitude) } })}
                  onMouseOut={() => setSelectedSensor(null)}
                />
              );
            })}

          {/* ✅ InfoWindow for Hover */}
          {selectedSensor && (
            <InfoWindow
              position={selectedSensor.position}
              onCloseClick={() => setSelectedSensor(null)}
            >
              <div className="info-window">
                <h3>🔥 Sensor Node: {selectedSensor.node_id}</h3>
                <table>
                  <tbody>
                    <tr><td><b>Temperature:</b></td><td>{selectedSensor.temperature}°C</td></tr>
                    <tr><td><b>Humidity:</b></td><td>{selectedSensor.humidity}%</td></tr>
                    <tr><td><b>Soil Moisture:</b></td><td>{selectedSensor.soil_moisture_percent}%</td></tr>
                    <tr><td><b>Pressure:</b></td><td>{selectedSensor.pressure} hPa</td></tr>
                    <tr><td><b>FWI Risk:</b></td><td>{selectedSensor.fwi}</td></tr>
                  </tbody>
                </table>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* ✅ Wildfire FWI Legend */}
        <div className="legend">
          <h4>🔥 FWI Risk Levels</h4>
          <div className="legend-item"><span className="legend-color very-low"></span> Very Low (0–10)</div>
          <div className="legend-item"><span className="legend-color low"></span> Low (10–20)</div>
          <div className="legend-item"><span className="legend-color moderate"></span> Moderate (20–30)</div>
          <div className="legend-item"><span className="legend-color high"></span> High (30–45)</div>
          <div className="legend-item"><span className="legend-color extreme"></span> Extreme (45+)</div>
        </div>
      </div>
    </div>
  );
}

export default MapView;
