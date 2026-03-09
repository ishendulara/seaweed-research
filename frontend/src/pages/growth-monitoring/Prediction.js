import React, { useEffect, useState } from "react";
import axios from "axios";
import PredictionForm   from "../../components/growth-monitoring/PredictionForm";
import PredictionSummary from "../../components/growth-monitoring/PredictionSummary";
import GrowthChart      from "../../components/growth-monitoring/GrowthChart";
import HistoryTable     from "../../components/growth-monitoring/HistoryTable";
import ProgressIndicator from "../../components/growth-monitoring/ProgressIndicator";
import AlertBox         from "../../components/growth-monitoring/AlertBox";
import "./Prediction.css"

const FARMER_ID = "Farmer01";
const EXPRESS   = "http://localhost:5001/api/plants";
const FLASK = "http://127.0.0.1:8000";

function Prediction() {
  const [plantIds, setPlantIds]       = useState([]);
  const [selectedPlant, setSelectedPlant] = useState("");
  const [newPlantId, setNewPlantId]   = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  const [species, setSpecies]   = useState("kappaphycus");
  const [weight, setWeight]     = useState("");
  const [startDay, setStartDay] = useState(0);

  const [data, setData]               = useState([]);
  const [harvestDay, setHarvestDay]   = useState(null);
  const [harvestWeight, setHarvestWeight] = useState(null);

  const [history, setHistory] = useState([]);
  const [alerts, setAlerts]   = useState([]);

  useEffect(() => {
    axios.get(`${EXPRESS}/ids/${FARMER_ID}`)
      .then(r => setPlantIds(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedPlant) { setHistory([]); return; }
    axios.get(`${EXPRESS}/history/${selectedPlant}`)
      .then(r => setHistory(r.data))
      .catch(console.error);
  }, [selectedPlant]);

  const activePlantId = creatingNew ? newPlantId : selectedPlant;

  const handlePredict = async () => {
    if (!activePlantId) { alert("Please select or create a Plant ID"); return; }
    try {
      const res = await axios.post(`${FLASK}/predict`, {
        species, initial_weight: Number(weight), start_day: Number(startDay)
      });
      setData(res.data.daily_predictions);
      setHarvestDay(res.data.predicted_harvest_day);
      setHarvestWeight(res.data.harvest_weight);
      await saveRecord(res.data);
      generateAlerts();
    } catch { alert("Prediction failed"); }
  };

  const saveRecord = async (result) => {
    const record = {
      plantId: activePlantId,
      farmerId: FARMER_ID,
      species,
      initialWeight: Number(weight),
      startDay: Number(startDay),
      date: new Date().toLocaleDateString(),
      harvestDay: result.predicted_harvest_day,
      harvestWeight: result.harvest_weight
    };
    await axios.post(`${EXPRESS}/save`, record);
    if (creatingNew) {
      const ids = await axios.get(`${EXPRESS}/ids/${FARMER_ID}`);
      setPlantIds(ids.data);
      setSelectedPlant(newPlantId);
      setCreatingNew(false);
      setNewPlantId("");
    }
    const hist = await axios.get(`${EXPRESS}/history/${activePlantId}`);
    setHistory(hist.data);
  };

  const generateAlerts = () => {
    const threshold = species === "kappaphycus" ? 1500 : 800;
    const prog = weight ? Math.min(Math.round((Number(weight)/threshold)*100),100) : 0;
    if (prog < 30)      setAlerts(["ℹ️ Growth is in early stage"]);
    else if (prog < 80) setAlerts(["✅ Growth is healthy"]);
    else                setAlerts(["⚠️ Harvest time approaching"]);
  };

  const threshold = species === "kappaphycus" ? 1500 : 800;
  const progress  = weight ? Math.min(Math.round((Number(weight)/threshold)*100),100) : 0;
  let stage = "Early Growth";
  if (progress > 40) stage = "Mid Growth";
  if (progress > 80) stage = "Ready for Harvest";

  return (
    <div className="prediction-page">

      {/* ── Full-width Header ── */}
      <div className="prediction-header">
        <div className="prediction-header-left">
          <div className="prediction-header-icon">🌿</div>
          <div>
            <h1 className="prediction-header-title">Growth Monitoring</h1>
            <p className="prediction-header-sub">Predict seaweed harvest cycles and track plant growth</p>
          </div>
        </div>
        <div className="prediction-header-badge">
          <span className="badge-dot"></span>
          AI Powered
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="section">
        <div className="card-grid">
          <div className="card">
            <PredictionForm
              plantIds={plantIds}
              selectedPlant={selectedPlant} setSelectedPlant={setSelectedPlant}
              creatingNew={creatingNew}    setCreatingNew={setCreatingNew}
              newPlantId={newPlantId}      setNewPlantId={setNewPlantId}
              species={species}            setSpecies={setSpecies}
              weight={weight}              setWeight={setWeight}
              startDay={startDay}          setStartDay={setStartDay}
              onPredict={handlePredict}
            />
          </div>
          <div className="card">
            <PredictionSummary harvestDay={harvestDay} harvestWeight={harvestWeight} />
            <AlertBox alerts={alerts} />
            <ProgressIndicator progress={progress} stage={stage} />
          </div>
        </div>
        {data.length > 0 && (
          <div className="chart-card">
            <GrowthChart data={data} harvestDay={harvestDay} />
          </div>
        )}
        {selectedPlant && (
          <HistoryTable history={history} plantId={selectedPlant} />
        )}
      </div>

    </div>
  );
}

export default Prediction;