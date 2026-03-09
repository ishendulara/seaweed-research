import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ESTankSelector from "../../components/environment-suitability/ESTankSelector";
import ESGaugeCard from "../../components/environment-suitability/ESGaugeCard";
import ESSuitabilityPanel from "../../components/environment-suitability/ESSuitabilityPanel";
import ESRecommendationPanel from "../../components/environment-suitability/ESRecommendationPanel";
import ESTankComparisonTable from "../../components/environment-suitability/ESTankComparisonTable";
import ESHistoryCharts from "../../components/environment-suitability/ESHistoryCharts";
import { getHistory24h, getLatest, postSensorData } from "../../utils/sensorApi";
import { getSocket } from "../../utils/sensorSocket";
import { TANKS } from "../../utils/sensorRanges";
import "./EnvironmentalSuitability.css";

function emptyMinMax() {
  return {
    temperature: { min: null, max: null },
    ph: { min: null, max: null },
    tds: { min: null, max: null },
    light: { min: null, max: null }
  };
}

function computeMinMax(history) {
  const out = emptyMinMax();
  const h = Array.isArray(history) ? history : [];
  for (const key of Object.keys(out)) {
    const values = h.map((x) => x[key]).filter((v) => typeof v === "number" && Number.isFinite(v));
    if (values.length) {
      out[key].min = Math.min(...values);
      out[key].max = Math.max(...values);
    }
  }
  return out;
}

export default function EnvironmentalSuitability() {
  const navigate = useNavigate();
  const [tankId, setTankId] = useState("TankA");
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [minMax24h, setMinMax24h] = useState(emptyMinMax());
  const [snapshotData, setSnapshotData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const lastRequestedTankRef = useRef("TankA");

  const handleManualSubmit = async () => {
    if (!latest) return alert("No live data to submit!");
    setSubmitting(true);
    try {
      const response = await postSensorData(latest);
      if (response.ok) {
        setSnapshotData((prev) => ({
          ...prev,
          [tankId]: { ...latest }
        }));
        alert(`${tankId} data saved and updated in Comparison Table!`);
        const h = await getHistory24h(tankId);
        setHistory(h);
      } else {
        alert("Failed to save data.");
      }
    } catch (err) {
      alert("Server Connection Error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadSelectedTank(tid) {
      setLoading(true);
      lastRequestedTankRef.current = tid;
      try {
        const [l, h] = await Promise.all([getLatest(tid).catch(() => null), getHistory24h(tid).catch(() => [])]);
        if (cancelled) return;
        if (lastRequestedTankRef.current !== tid) return;
        setLatest(l);
        setHistory(h);
        setMinMax24h(computeMinMax(h));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSelectedTank(tankId);
    return () => { cancelled = true; };
  }, [tankId]);

  useEffect(() => {
    const socket = getSocket();
    function onSensorData(payload) {
      if (!payload || !payload.tankId) return;
      const normalized = {
        tankId: payload.tankId,
        temperature: Number(payload.temperature),
        ph: Number(payload.ph),
        tds: Number(payload.tds),
        light: Number(payload.light),
        timestamp: payload.timestamp || new Date().toISOString()
      };
      if (normalized.tankId === tankId) {
        setLatest(normalized);
      }
    }
    socket.on("sensorData", onSensorData);
    return () => { socket.off("sensorData", onSensorData); };
  }, [tankId]);

  useEffect(() => {
    setMinMax24h(computeMinMax(history));
  }, [history]);

  const subtitle = useMemo(() => {
    const label = TANKS.find((t) => t.id === tankId)?.label || tankId;
    const ts = latest?.timestamp ? new Date(latest.timestamp) : null;
    return `${label} • ${ts ? `Live Monitoring: ${ts.toLocaleTimeString()}` : "Waiting for live feed..."}`;
  }, [tankId, latest]);

  return (
    <div className="es-page">
      {/* Header */}
      <header className="es-header">
        <div className="es-header-content">
          <div className="es-header-left">
            <button className="es-back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div className="es-header-logo">🌊</div>
            <div>
              <h1 className="es-header-title">Seaweed System</h1>
              <p className="es-header-sub">Smart Seaweed Hub</p>
            </div>
          </div>
        </div>
      </header>

      <div className="es-container">
        <div className="es-top-bar">
          <div>
            <div className="es-section-tag">SEAWEED SMART FARMING</div>
            <div className="es-page-title">Environmental Suitability - Research Control Panel</div>
            <div className="es-page-subtitle">{subtitle}</div>
          </div>
          <div className="es-top-actions">
            <ESTankSelector value={tankId} onChange={setTankId} />
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              className={`es-submit-btn ${submitting ? "es-submit-btn-disabled" : ""}`}
            >
              {submitting ? "Saving..." : "Submit Tank Data"}
            </button>
          </div>
        </div>

        {/* Gauge cards */}
        <div className="es-gauge-grid">
          <ESGaugeCard metricKey="temperature" value={latest?.temperature} minMax24h={minMax24h.temperature} />
          <ESGaugeCard metricKey="ph" value={latest?.ph} minMax24h={minMax24h.ph} />
          <ESGaugeCard metricKey="tds" value={latest?.tds} minMax24h={minMax24h.tds} />
          <ESGaugeCard metricKey="light" value={latest?.light} minMax24h={minMax24h.light} />
        </div>

        {/* Suitability panel */}
        <div className="es-section">
          <ESSuitabilityPanel reading={latest} />
        </div>

        {/* Bottom grid */}
        <div className="es-bottom-grid">
          <div className="es-bottom-left">
            <ESRecommendationPanel latestByTank={snapshotData} />
          </div>
          <div className="es-bottom-right">
            <ESTankComparisonTable latestByTank={snapshotData} />
            <div className="es-charts-section">
              <ESHistoryCharts history={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
