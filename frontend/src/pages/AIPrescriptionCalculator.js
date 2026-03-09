// frontend/src/pages/AIPrescriptionCalculator.js
// Step 4: Enter amount → "Next: Select Quality Factors →" → QualityFactorsPage

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSeaweedTypes,
  getHealthCategories,
  getPrescriptions,
  getPrescriptionDetail,
} from "../services/prescriptionAPI";
import "./AIPrescriptionCalculator.css";

const SEAWEED_ICONS = {
  "Gracilaria Edulis": "🌿",
  "Kappaphycus Alvarezii": "🌊",
};

const AIPrescriptionCalculator = () => {
  const navigate = useNavigate();
  const [step, setStep]                             = useState(1);
  const [seaweedTypes, setSeaweedTypes]             = useState([]);
  const [categories, setCategories]                 = useState([]);
  const [prescriptions, setPrescriptions]           = useState([]);
  const [prescriptionDetail, setPrescriptionDetail] = useState(null);
  const [selectedSeaweed, setSelectedSeaweed]       = useState(null);
  const [selectedCategory, setSelectedCategory]     = useState(null);
  const [selectedKey, setSelectedKey]               = useState(null);
  const [seaweedAmount, setSeaweedAmount]           = useState("");
  const [amountError, setAmountError]               = useState("");
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState("");

  useEffect(() => {
    setLoading(true);
    getSeaweedTypes()
      .then(setSeaweedTypes)
      .catch(() => setError("Could not load seaweed types. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectSeaweed = useCallback(async (sw) => {
    setSelectedSeaweed(sw);
    setStep(2);
    setLoading(true);
    setError("");
    try {
      const cats = await getHealthCategories(sw.name);
      setCategories(cats);
    } catch { setError("Could not load categories."); }
    finally { setLoading(false); }
  }, []);

  const handleSelectCategory = useCallback(async (cat) => {
    setSelectedCategory(cat);
    setStep(3);
    setLoading(true);
    setError("");
    try {
      const list = await getPrescriptions(selectedSeaweed.name, cat);
      setPrescriptions(list);
    } catch { setError("Could not load prescriptions."); }
    finally { setLoading(false); }
  }, [selectedSeaweed]);

  const handleSelectPrescription = useCallback(async (key) => {
    setSelectedKey(key);
    setStep(4);
    setLoading(true);
    setError("");
    setSeaweedAmount("");
    setAmountError("");
    try {
      const detail = await getPrescriptionDetail(key);
      setPrescriptionDetail(detail);
    } catch { setError("Could not load prescription details."); }
    finally { setLoading(false); }
  }, []);

  // ── Go to QualityFactorsPage ───────────────────────────────────────────
  const handleGoToQuality = () => {
    const amount = parseFloat(seaweedAmount);
    if (!amount || amount <= 0) {
      setAmountError("Please enter a valid seaweed amount greater than 0.");
      return;
    }
    setAmountError("");
    navigate("/quality-factors", {
      state: {
        prescriptionDetail,
        prescriptionKey: selectedKey,
        seaweedAmount:   amount,
        seaweedUnit:     prescriptionDetail?.ingredients?.[0]?.unit || "g",
      },
    });
  };

  const goToStep = (n) => {
    if (n === 1) { setSelectedSeaweed(null); setSelectedCategory(null); setStep(1); }
    if (n === 2) { setSelectedCategory(null); setStep(2); }
    if (n === 3) { setStep(3); }
  };

  return (
    <div className="prescription-calculator-page">

      {/* ── Header ── */}
      <header className="prescription-header">
        <div className="header-content">
          <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
          <div className="header-title">
            <h1>💊 AI Prescription Calculator</h1>
            <p>Seaweed-based traditional medicine formulation assistant</p>
          </div>
          <div className="llama-badge">⚡ Llama 3.3 AI</div>
        </div>
      </header>

      <div className="prescription-container">

        {/* ── Breadcrumb ── */}
        {step > 1 && (
          <div className="breadcrumb">
            <button onClick={() => goToStep(1)}>Seaweed</button>
            {step >= 2 && <><span>›</span><button onClick={() => goToStep(2)}>{selectedSeaweed?.name}</button></>}
            {step >= 3 && <><span>›</span><button onClick={() => goToStep(3)}>{selectedCategory}</button></>}
            {step === 4 && <><span>›</span><span>{prescriptionDetail?.name}</span></>}
          </div>
        )}

        {error && <div className="error-banner">⚠️ {error}</div>}
        {loading && <div className="loading-state">Loading...</div>}

        {/* ── STEP 1 ── */}
        {step === 1 && !loading && (
          <div className="selection-view">
            <h2>Step 1: Select Seaweed Type</h2>
            <div className="seaweed-cards">
              {seaweedTypes.map((sw) => (
                <div key={sw.name} className="seaweed-card" onClick={() => handleSelectSeaweed(sw)}>
                  <div className="seaweed-icon">{SEAWEED_ICONS[sw.name] || "🌱"}</div>
                  <h3>{sw.name}</h3>
                  <p>{sw.description}</p>
                  <div className="properties">
                    {(sw.properties || []).map((p, i) => (
                      <span key={i} className="property-tag">{p}</span>
                    ))}
                  </div>
                  <button className="select-btn">Select →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && !loading && (
          <div className="selection-view">
            <h2>Step 2: Select Health Category</h2>
            <div className="category-cards">
              {categories.map((cat) => (
                <div key={cat} className="category-card" onClick={() => handleSelectCategory(cat)}>
                  <div className="category-icon">💊</div>
                  <h3>{cat}</h3>
                  <button className="select-btn">View Prescriptions →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && !loading && (
          <div className="prescriptions-list-view">
            <h2>Available Prescriptions</h2>
            <p className="subtitle">
              {prescriptions.length} prescriptions found for <strong>{selectedCategory}</strong> using <em>{selectedSeaweed?.name}</em>
            </p>
            <div className="prescriptions-grid">
              {prescriptions.map((p) => (
                <div key={p.key} className="prescription-item" onClick={() => handleSelectPrescription(p.key)}>
                  <h3>{p.name}</h3>
                  <p className="short-desc">{p.health_category_raw}</p>
                  <div className="prescription-meta">
                    <span className="meta-item">🧪 {p.ingredient_count} Ingredients</span>
                    <span className="meta-item">⏱️ {p.duration || "N/A"}</span>
                    <span className="meta-item">🌡️ {p.temperature}</span>
                  </div>
                  <p className="dose-hint">Dose: {p.recommended_dose}</p>
                  <button className="view-details-btn">View Details & Calculate →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && !loading && prescriptionDetail && (
          <div className="prescription-details-view">
            <div className="details-layout">

              {/* Left: Prescription details */}
              <div className="details-panel">
                <h2>{prescriptionDetail.name}</h2>
                <p className="prescription-desc">{prescriptionDetail.health_category_raw}</p>

                <div className="details-section">
                  <h3>📋 Base Ingredients</h3>
                  <div className="ingredients-list">
                    {prescriptionDetail.ingredients.filter(i => i.name).map((ing, i) => (
                      <div key={i} className="ingredient-item">
                        <span className="ing-name">{ing.name}</span>
                        <span className="ing-ratio">
                          {ing.value ? `${ing.value} ${ing.unit}` : ing.quantity_raw || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {prescriptionDetail.preparation_steps?.length > 0 && (
                  <div className="details-section">
                    <h3>👨‍🍳 Preparation Method</h3>
                    <ol className="preparation-list">
                      {prescriptionDetail.preparation_steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}

                <div className="details-section">
                  <h3>🔬 Technical Specifications</h3>
                  <div className="specs-grid">
                    {[
                      ["🌡️ Temperature", prescriptionDetail.temperature],
                      ["⏱️ Duration", prescriptionDetail.duration],
                      ["🥄 Mixing Method", prescriptionDetail.mixing_method],
                      ["⚗️ pH Control", prescriptionDetail.ph_control],
                      ["💧 Moisture", prescriptionDetail.moisture],
                      ["💊 Recommended Dose", prescriptionDetail.recommended_dose],
                    ].map(([label, value]) => (
                      <div key={label} className="spec-item">
                        <span className="spec-label">{label}</span>
                        <span className="spec-value">{value || "Not specified"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {prescriptionDetail.critical_control_points?.length > 0 && (
                  <div className="details-section">
                    <h3>⚠️ Critical Control Points</h3>
                    <ul className="critical-list">
                      {prescriptionDetail.critical_control_points.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                )}

                {prescriptionDetail.quality_control?.length > 0 && (
                  <div className="details-section">
                    <h3>✅ Quality Control</h3>
                    <ul className="quality-list">
                      {prescriptionDetail.quality_control.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}

                {prescriptionDetail.contraindications && (
                  <div className="details-section warning-box">
                    <h3>⚠️ Contraindications / Notes</h3>
                    <p>{prescriptionDetail.contraindications}</p>
                    <p className="disclaimer">
                      <strong>Disclaimer:</strong> Always consult a qualified healthcare professional before use.
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Amount input + quality teaser */}
              <div className="calculator-panel">
                <div className="calculator-active">

                  <div className="calc-panel-header">
                    <h3>🧮 AI Ingredient Calculator</h3>
                    <span className="llama-badge-sm">⚡ Llama 3.3 AI</span>
                  </div>

                  <p className="calc-panel-sub">
                    Enter how much seaweed you have. On the next page, you'll select
                    quality factors — the AI adjusts amounts automatically.
                  </p>

                  {/* Recommended dose */}
                  <div className="range-info">
                    <h4>Recommended Dose:</h4>
                    <p className="range-value">{prescriptionDetail.recommended_dose || "See label"}</p>
                  </div>

                  {/* Amount input */}
                  <div className="calculator-input">
                    <label>Enter Seaweed Amount</label>
                    <div className="input-group">
                      <input
                        type="number"
                        value={seaweedAmount}
                        onChange={(e) => { setSeaweedAmount(e.target.value); setAmountError(""); }}
                        placeholder="0"
                        step="0.5"
                        min="0.1"
                      />
                      <span className="unit">{prescriptionDetail.ingredients[0]?.unit || "g"}</span>
                    </div>
                    {amountError && <p className="input-error">{amountError}</p>}
                  </div>

                  {/* CTA to quality page */}
                  <button
                    className={`calculate-btn ${seaweedAmount ? "" : "disabled-btn"}`}
                    onClick={handleGoToQuality}
                    disabled={!seaweedAmount}
                  >
                    Next: Select Quality Factors →
                  </button>

                  {/* Quality teaser */}
                  <div className="quality-teaser">
                    <div className="qt-header">
                      <span>🌿 Seaweed Quality Factors</span>
                      <span className="quality-badge">NEW</span>
                    </div>
                    <p className="qt-sub">
                      On the next page, tell us your seaweed's harvest conditions.
                      Our ML model predicts quality and adjusts prescription amounts.
                    </p>
                    <div className="qt-factors">
                      {["☀️ Season", "🌱 Freshness", "🌊 Location"].map(f => (
                        <span key={f} className="qt-factor-chip">{f}</span>
                      ))}
                    </div>
                    <div className="qt-ml-note">
                      ⚡ GradientBoosting + RandomForest &nbsp;·&nbsp; 630 prescriptions &nbsp;·&nbsp;
                      <strong style={{ color: "#059669" }}>95.2% accuracy</strong>
                    </div>
                  </div>

                  {/* Report includes */}
                  <div className="report-includes">
                    <p className="ri-title">📋 Your report will include:</p>
                    {[
                      "✅ Quality-adjusted ingredient amounts",
                      "🌿 Seaweed quality impact explanation",
                      "📊 Visual bar & pie charts",
                      "🔬 Scientific reasoning",
                      "💡 AI preparation tips",
                      "⚠️ Quality-based warnings",
                    ].map((item, i) => (
                      <div key={i} className="ri-item">{item}</div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIPrescriptionCalculator;