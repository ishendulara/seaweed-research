import React, { useEffect, useMemo, useRef, useState } from "react";
import TankSelector from "../components/TankSelector.jsx";
import GaugeCard from "../components/GaugeCard.jsx";
import SuitabilityPanel from "../components/SuitabilityPanel.jsx";
import RecommendationPanel from "../components/RecommendationPanel.jsx";
import TankComparisonTable from "../components/TankComparisonTable.jsx";
import HistoryCharts from "../components/HistoryCharts.jsx";
import Card from "../components/Card.jsx";
import { getHistory24h, getLatest } from "../lib/api.js";
import { getSocket } from "../lib/socket.js";
import { METRICS, TANKS } from "../lib/ranges.js";

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

export default function Dashboard() {
  const [tankId, setTankId] = useState("TankA");
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [minMax24h, setMinMax24h] = useState(emptyMinMax());
  const [latestByTank, setLatestByTank] = useState({});
  const [snapshotData, setSnapshotData] = useState({}); // වගුව සඳහා පමණක් භාවිතා වන Snapshot state එක
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const lastRequestedTankRef = useRef("TankA");

  // Submit Logic - දත්ත පද්ධතියට සහ වගුවට ඇතුළත් කිරීම
  const handleManualSubmit = async () => {
    if (!latest) return alert("No live data to submit!");
    setSubmitting(true);
    try {
      const response = await fetch("http://172.20.10.3:4000/api/sensor-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest)
      });
      
      if (response.ok) {
        // Submit කළ සැනින් එම දත්ත වගුව (Table) සඳහා පමණක් වෙන් කරන්න
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
      setLatestByTank((prev) => ({ ...prev, [normalized.tankId]: normalized }));
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
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-emerald-200/80">SEAWEED SMART FARMING</div>
          <div className="mt-2 text-2xl font-semibold text-slate-100">Research Control Panel</div>
          <div className="mt-2 text-sm text-slate-400">{subtitle}</div>
        </div>
        <div className="flex items-center gap-3">
          <TankSelector value={tankId} onChange={setTankId} />
          <button 
            onClick={handleManualSubmit}
            disabled={submitting}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition-all ${
              submitting ? "bg-slate-600" : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
            }`}
          >
            {submitting ? "Saving..." : "Submit Tank Data"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <GaugeCard metricKey="temperature" value={latest?.temperature} minMax24h={minMax24h.temperature} />
        <GaugeCard metricKey="ph" value={latest?.ph} minMax24h={minMax24h.ph} />
        <GaugeCard metricKey="tds" value={latest?.tds} minMax24h={minMax24h.tds} />
        <GaugeCard metricKey="light" value={latest?.light} minMax24h={minMax24h.light} />
      </div>

      <div className="mt-8">
        <SuitabilityPanel reading={latest} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RecommendationPanel latestByTank={snapshotData} />
        </div>
        <div className="lg:col-span-2">
          {/* මෙතැනදී snapshotData ලබා දීමෙන් real-time update වීම නතර කරගත හැක */}
          <TankComparisonTable latestByTank={snapshotData} />
          <div className="mt-6">
            <HistoryCharts history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}