import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./SpeciesIdentification.css";

const FARMER_ID = "Farmer01";
const EXPRESS = "http://localhost:5001/api/predictions";
const FLASK_SEAWEED = "http://127.0.0.1:5002";

function SpeciesIdentification() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typeResult, setTypeResult] = useState(null);
  const [healthResult, setHealthResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Load prediction history
  const loadHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${EXPRESS}/history/${FARMER_ID}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPEG or PNG)");
      return;
    }
    setImageFile(file);
    setError(null);
    setTypeResult(null);
    setHealthResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => handleFileSelect(e.target.files[0]);

  // Drag & drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  // Call Flask ML API
  const handleAnalyze = async () => {
    if (!imageFile) { setError("Please upload an image first"); return; }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await axios.post(`${FLASK_SEAWEED}/predict/full`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTypeResult(res.data.type_result);
      setHealthResult(res.data.health_result);

      // Save to MongoDB via Express
      await axios.post(`${EXPRESS}/save`, {
        farmerId: FARMER_ID,
        imageFilename: imageFile.name,
        date: new Date().toLocaleDateString(),
        speciesLabel: res.data.type_result.label,
        speciesConf: res.data.type_result.confidence,
        speciesRejected: res.data.type_result.rejected,
        healthLabel: res.data.health_result.label,
        healthStatus: res.data.health_result.health_status,
        healthSpecies: res.data.health_result.species,
        healthConf: res.data.health_result.confidence,
        healthRejected: res.data.health_result.rejected,
      });
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Make sure the Flask ML server is running on port 5002.");
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setTypeResult(null);
    setHealthResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="si-page">
      {/* Header */}
      <div className="si-header">
        <div className="si-header-left">
          <div className="si-header-icon">🔬</div>
          <div>
            <h1 className="si-header-title">Species Identification & Health Classification</h1>
            <p className="si-header-sub">Upload a seaweed image to identify species and assess health status</p>
          </div>
        </div>
        <div className="si-header-badge">
          <span className="si-badge-dot"></span>
          AI Powered
        </div>
      </div>

      {/* Content */}
      <div className="si-section">
        <div className="si-card-grid">
          {/* Left Card — Upload */}
          <div className="si-card">
            <h3>📤 Upload Seaweed Image</h3>

            <div
              className={`si-dropzone ${dragOver ? "si-dropzone-active" : ""} ${imagePreview ? "si-dropzone-has-image" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="si-preview-img" />
              ) : (
                <div className="si-dropzone-content">
                  <div className="si-dropzone-icon">📸</div>
                  <p className="si-dropzone-text">Drag & drop an image here</p>
                  <p className="si-dropzone-sub">or click to browse (JPEG / PNG)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleInputChange}
                hidden
              />
            </div>

            <div className="si-btn-row">
              <button
                className="si-btn-primary"
                onClick={handleAnalyze}
                disabled={!imageFile || loading}
              >
                {loading ? (
                  <><span className="si-spinner"></span> Analyzing...</>
                ) : (
                  "🔍 Analyze Image"
                )}
              </button>
              <button className="si-btn-secondary" onClick={handleReset}>
                ↻ Reset
              </button>
            </div>
          </div>

          {/* Right Card — Results */}
          <div className="si-card">
            <h3>📊 Analysis Results</h3>

            {!typeResult && !healthResult && (
              <div className="si-placeholder">
                <div className="si-placeholder-icon">🧪</div>
                <p>Upload an image and click "Analyze" to see results</p>
              </div>
            )}

            {/* Species Result */}
            {typeResult && (
              <div className="si-result-block">
                <h4>🌿 Species Identification</h4>
                {typeResult.rejected ? (
                  <div className="si-alert si-alert-warning">
                    ⚠️ <strong>Low Confidence:</strong> {typeResult.reason || `Confidence ${(typeResult.confidence * 100).toFixed(1)}% is below threshold`}
                  </div>
                ) : (
                  <div className="si-result-label">
                    <span className="si-species-name">{formatLabel(typeResult.label)}</span>
                    <span className={`si-conf-badge ${getConfClass(typeResult.confidence)}`}>
                      {(typeResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <ConfidenceBar label="Confidence" value={typeResult.confidence} />
                <ProbabilityBars probabilities={typeResult.probabilities} />
              </div>
            )}

            {/* Health Result */}
            {healthResult && (
              <div className="si-result-block">
                <h4>🩺 Health Classification</h4>
                {healthResult.rejected ? (
                  <div className="si-alert si-alert-warning">
                    ⚠️ <strong>Low Confidence:</strong> {healthResult.reason || `Confidence ${(healthResult.confidence * 100).toFixed(1)}% is below threshold`}
                  </div>
                ) : (
                  <div className="si-result-label">
                    <span className={`si-health-status ${healthResult.health_status === "healthy" ? "si-healthy" : "si-unhealthy"}`}>
                      {healthResult.health_status === "healthy" ? "✅ Healthy" : "🔴 Unhealthy"}
                    </span>
                    <span className="si-health-species">({formatLabel(healthResult.species)})</span>
                    <span className={`si-conf-badge ${getConfClass(healthResult.confidence)}`}>
                      {(healthResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <ConfidenceBar label="Confidence" value={healthResult.confidence} />
                <ProbabilityBars probabilities={healthResult.probabilities} />
              </div>
            )}
          </div>
        </div>

        {/* History Table */}
        {history.length > 0 && (
          <div className="si-card si-history-card">
            <h3>📋 Prediction History</h3>
            <div className="si-table-wrap">
              <table className="si-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Image</th>
                    <th>Species</th>
                    <th>Confidence</th>
                    <th>Health</th>
                    <th>Health Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rec, i) => (
                    <tr key={rec._id}>
                      <td>{i + 1}</td>
                      <td>{rec.date}</td>
                      <td className="si-td-filename">{rec.imageFilename}</td>
                      <td>
                        <span className={`si-pill ${rec.speciesRejected ? "si-pill-warn" : "si-pill-teal"}`}>
                          {formatLabel(rec.speciesLabel)}
                        </span>
                      </td>
                      <td>{rec.speciesConf != null ? `${(rec.speciesConf * 100).toFixed(1)}%` : "—"}</td>
                      <td>
                        <span className={`si-pill ${rec.healthStatus === "healthy" ? "si-pill-green" : "si-pill-red"}`}>
                          {rec.healthStatus === "healthy" ? "✅ Healthy" : "🔴 Unhealthy"}
                        </span>
                      </td>
                      <td>{rec.healthConf != null ? `${(rec.healthConf * 100).toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────── SUB-COMPONENTS ──────────── */

function ConfidenceBar({ label, value }) {
  const pct = (value * 100).toFixed(1);
  return (
    <div className="si-conf-bar-wrap">
      <div className="si-conf-bar-label">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="si-conf-bar-track">
        <div
          className={`si-conf-bar-fill ${getConfClass(value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProbabilityBars({ probabilities }) {
  if (!probabilities) return null;
  const entries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  return (
    <div className="si-prob-section">
      <p className="si-prob-title">Probability Breakdown</p>
      {entries.map(([label, val]) => (
        <div key={label} className="si-prob-row">
          <span className="si-prob-label">{formatLabel(label)}</span>
          <div className="si-prob-track">
            <div className="si-prob-fill" style={{ width: `${(val * 100).toFixed(1)}%` }} />
          </div>
          <span className="si-prob-val">{(val * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

/* ──────────── HELPERS ──────────── */

function formatLabel(label) {
  if (!label) return "Unknown";
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getConfClass(conf) {
  if (conf >= 0.8) return "si-conf-high";
  if (conf >= 0.5) return "si-conf-mid";
  return "si-conf-low";
}

export default SpeciesIdentification;
