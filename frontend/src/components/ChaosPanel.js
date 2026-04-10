import React, { useState } from "react";
import axios from "axios";

// Helper for the frontend to know its API URL based on hackathon environment
const API_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : "/api";

const ChaosPanel = () => {
  const [status, setStatus] = useState("System stable");

  const triggerChaos = async (endpoint, name) => {
    try {
      setStatus(`Triggering ${name}...`);
      await axios.get(`${API_URL}/chaos/${endpoint}`);
      setStatus(`${name} triggered successfully`);
    } catch (error) {
      // In some chaos endpoints (like crash), the request may fail out, which is expected
      setStatus(`Error triggering ${name}: Request failed (likely intentional)`);
    }
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>🚨 Kubernetes Chaos Engineering Panel</h3>
      <p style={{ margin: "5px 0 15px", fontSize: "14px", color: "orange" }}>
        Status: {status}
      </p>
      
      <div style={styles.buttonGrid}>
        <button 
          style={styles.button}
          onClick={() => triggerChaos("crash", "Process Crash")}
        >
          💥 Crash Pod (process.exit)
        </button>
        
        <button 
          style={styles.button}
          onClick={() => triggerChaos("oom", "Memory Leak")}
        >
          📈 Trigger OOM (Memory Leak)
        </button>
        
        <button 
          style={styles.button}
          onClick={() => triggerChaos("freeze", "CPU Freeze")}
        >
          ❄️ Freeze Process (Lock CPU)
        </button>
        
        <button 
          style={styles.button}
          onClick={() => triggerChaos("fail-health", "Liveness Probe Failure")}
        >
          🏥 Fail Liveness Probe (/health)
        </button>
        
        <button 
          style={{...styles.button, backgroundColor: "#fd7e14"}}
          onClick={() => triggerChaos("500", "HTTP 500 API Error")}
        >
          🔥 Simulate HTTP 500 (API Failure)
        </button>
        
        <button 
          style={{...styles.button, backgroundColor: "#ffc107", color: "black"}}
          onClick={() => triggerChaos("400", "HTTP 400 Bad Request")}
        >
          ⚠️ Simulate HTTP 400 (Bad Request)
        </button>

        <button 
          style={{...styles.button, backgroundColor: "#6f42c1"}}
          onClick={() => triggerChaos("reference-error", "ReferenceError Crash")}
        >
          🐛 Throw ReferenceError (AI Debug Test)
        </button>

        <button 
          style={{...styles.button, backgroundColor: "#e83e8c"}}
          onClick={() => triggerChaos("type-error", "TypeError Crash")}
        >
          🐛 Throw TypeError (AI Debug Test)
        </button>

        <button 
          style={{...styles.button, backgroundColor: "#d39e00", color: "black"}}
          onClick={() => triggerChaos("traffic-spike", "20k Request Traffic Spike")}
        >
          ⚡ Load Test: 20k Requests (CPU Spike)
        </button>
      </div>
    </div>
  );
};

const styles = {
  panel: {
    marginTop: "40px",
    padding: "20px",
    backgroundColor: "#2c0b0e",
    border: "2px solid #dc3545",
    borderRadius: "8px",
    color: "white",
    textAlign: "center"
  },
  title: {
    margin: "0",
    color: "#ff6b6b"
  },
  buttonGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center"
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.2s"
  }
};

export default ChaosPanel;
