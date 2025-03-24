import "./Home.css";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
    return (
        <div>
            <Navbar />
            <div className="Home">
                <div className="home-content">
                    <h1>Welcome to the WildFire Prediction System</h1>
                    <p>
                        Stay informed with real-time environmental data and fire risk insights to help protect our forests and communities.
                    </p>
                    <div className="home-buttons">
                        <Link to="/reports" className="home-btn">📊 View Reports</Link>
                        <Link to="/tables" className="home-btn">📜 View Tables</Link>
                        <Link to="/mapview" className="home-btn">🗺️ Map View</Link>
                    </div>

                    <div className="info-cards">
                        <div className="info-card">
                            <h3>🔥 Fire Weather</h3>
                            <p>Get real-time fire weather conditions to understand wildfire risks.</p>
                        </div>
                        <div className="info-card">
                            <h3>📍 Fire Behavior</h3>
                            <p>Monitor and analyze fire spread and behavior predictions.</p>
                        </div>
                        <div className="info-card">
                            <h3>🛰️ Satellite Data</h3>
                            <p>Access historical and live satellite data for early fire detection.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
