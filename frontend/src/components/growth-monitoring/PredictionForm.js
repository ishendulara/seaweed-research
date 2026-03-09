import React, { useEffect, useState } from "react";

function PredictionForm({
  plantIds, selectedPlant, setSelectedPlant,
  creatingNew, setCreatingNew, newPlantId, setNewPlantId,
  species, setSpecies, weight, setWeight,
  startDay, setStartDay, onPredict
}) {
  const [liveWeight, setLiveWeight] = useState(null);
  const [iotStatus, setIotStatus]   = useState("connecting...");

  // Poll Flask every 2 seconds for latest Arduino weight
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res  = await fetch("http://127.0.0.1:8000/iot-weight");
        const data = await res.json();

        if (data.weight !== null && data.weight !== undefined) {
          setLiveWeight(data.weight);
          setIotStatus("live");
        } else {
          setIotStatus("waiting for reading...");
        }
      } catch {
        setIotStatus("not connected");
        setLiveWeight(null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Input Details</h3>

      {/* ── PLANT ID SECTION ── */}
      <label>Plant ID</label>
      {!creatingNew ? (
        <>
          <select
            value={selectedPlant}
            onChange={e => setSelectedPlant(e.target.value)}
          >
            <option value="">-- Select Plant ID --</option>
            {plantIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <button
            type="button"
            style={{ marginTop: 8, background: "#40916c" }}
            onClick={() => { setCreatingNew(true); setSelectedPlant(""); }}
          >
            + Create New Plant ID
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter new Plant ID (e.g. PLANT-003)"
            value={newPlantId}
            onChange={e => setNewPlantId(e.target.value)}
          />
          <button
            type="button"
            style={{ marginTop: 8, background: "#888" }}
            onClick={() => { setCreatingNew(false); setNewPlantId(""); }}
          >
            ← Back to existing IDs
          </button>
        </>
      )}

      {/* ── SEAWEED TYPE ── */}
      <label style={{ marginTop: 16 }}>Seaweed Type</label>
      <select value={species} onChange={e => setSpecies(e.target.value)}>
        <option value="kappaphycus">Kappaphycus alvarezii</option>
        <option value="gracilaria">Gracilaria edulis</option>
      </select>

      {/* ── WEIGHT WITH IOT ── */}
      <label style={{ marginTop: 16 }}>Weight (g)</label>

      {/* Live IoT reading box */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        marginBottom: 8,
        background: iotStatus === "live" ? "#f0faf4" : "#f5f5f5",
        border: `1px solid ${iotStatus === "live" ? "#40916c" : "#ccc"}`,
        borderRadius: 6
      }}>
        <span style={{ fontSize: 18 }}>
          {iotStatus === "live" ? "⚖️" : "🔌"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#888" }}>
            IoT Scale — {iotStatus}
          </div>
          <div style={{ fontWeight: "bold", color: "#1B4332" }}>
            {liveWeight !== null ? `${liveWeight} g` : "—"}
          </div>
        </div>
        {liveWeight !== null && (
          <button
            type="button"
            onClick={() => setWeight(String(liveWeight))}
            style={{
              background: "#2d6a4f",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 13
            }}
          >
            Use This Weight
          </button>
        )}
      </div>

      {/* Manual input still available */}
      <input
        type="number"
        value={weight}
        placeholder="Or enter manually"
        onChange={e => setWeight(e.target.value)}
      />

      {/* ── DAY ── */}
      <label style={{ marginTop: 16 }}>Day</label>
      <input
        type="number"
        value={startDay}
        onChange={e => setStartDay(e.target.value)}
      />

      <button onClick={onPredict} style={{ marginTop: 20 }}>
        Predict Growth
      </button>
    </div>
  );
}

export default PredictionForm;