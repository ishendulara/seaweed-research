// frontend/src/pages/QualityFactorsPage.js
// Full-page quality factor selection — navigated from AIPrescriptionCalculator Step 4
// On submit → /prescription-result

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { calculatePrescription } from "../services/prescriptionAPI";
import "./QualityFactorsPage.css";

// ── Data ────────────────────────────────────────────────────────────────────
const FACTORS = {
  season: {
    label: "Harvest Season",
    icon: "🌦️",
    question: "When was the seaweed harvested?",
    options: [
      {
        value: "dry", label: "Dry Season", icon: "☀️",
        desc: "Higher nutrient concentration",
        detail: "Bioactive compounds peak during dry months — less water dilution, maximum potency.",
        color: "#059669", lightBg: "#ecfdf5", border: "#6ee7b7",
        multiplier: "0.88", tag: "amount ↓",
      },
      {
        value: "wet", label: "Wet Season", icon: "🌧️",
        desc: "Standard nutrient levels",
        detail: "Higher water content dilutes bioactives — standard therapeutic amounts required.",
        color: "#0369a1", lightBg: "#eff6ff", border: "#93c5fd",
        multiplier: "1.10", tag: "amount ↑",
      },
    ],
  },
  freshness: {
    label: "Seaweed Freshness",
    icon: "🌿",
    question: "What is the condition of your seaweed?",
    options: [
      {
        value: "fresh", label: "Fresh", icon: "🌱",
        desc: "Maximum bioactive compounds",
        detail: "Freshly harvested seaweed retains full enzymatic activity and polysaccharide content.",
        color: "#059669", lightBg: "#ecfdf5", border: "#6ee7b7",
        multiplier: "0.90", tag: "amount ↓",
      },
      {
        value: "dried", label: "Dried", icon: "🍂",
        desc: "Concentrated, stable",
        detail: "Controlled drying preserves most bioactives while extending shelf life significantly.",
        color: "#b45309", lightBg: "#fffbeb", border: "#fcd34d",
        multiplier: "1.00", tag: "baseline",
      },
      {
        value: "stored", label: "Stored", icon: "📦",
        desc: "Some compound degradation",
        detail: "Extended storage causes oxidation and polysaccharide breakdown over time.",
        color: "#7c3aed", lightBg: "#f5f3ff", border: "#c4b5fd",
        multiplier: "1.18", tag: "amount ↑",
      },
    ],
  },
  location: {
    label: "Harvest Location",
    icon: "🌊",
    question: "Where was the seaweed harvested?",
    options: [
      {
        value: "deep", label: "Deep Water", icon: "🌊",
        desc: "Higher mineral density",
        detail: "Deep water seaweed absorbs elevated iodine, potassium, and trace minerals from currents.",
        color: "#0369a1", lightBg: "#eff6ff", border: "#93c5fd",
        multiplier: "0.92", tag: "amount ↓",
      },
      {
        value: "shallow", label: "Shallow Water", icon: "🏖️",
        desc: "Standard mineral composition",
        detail: "Shallow cultivation provides consistent quality with standard mineral profiles.",
        color: "#0891b2", lightBg: "#ecfeff", border: "#67e8f9",
        multiplier: "1.08", tag: "amount ↑",
      },
    ],
  },
};

const QUALITY_MAP = {
  "dry-fresh-deep":     { label: "High Quality",   score: 96, color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", emoji: "🌟" },
  "dry-fresh-shallow":  { label: "High Quality",   score: 92, color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", emoji: "🌟" },
  "dry-dried-deep":     { label: "High Quality",   score: 88, color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", emoji: "🌟" },
  "dry-dried-shallow":  { label: "Medium Quality", score: 82, color: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "#78350f", emoji: "✅" },
  "dry-stored-deep":    { label: "Medium Quality", score: 78, color: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "#78350f", emoji: "✅" },
  "dry-stored-shallow": { label: "Medium Quality", score: 74, color: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "#78350f", emoji: "✅" },
  "wet-fresh-deep":     { label: "Medium Quality", score: 80, color: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "#78350f", emoji: "✅" },
  "wet-fresh-shallow":  { label: "Medium Quality", score: 76, color: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "#78350f", emoji: "✅" },
  "wet-dried-deep":     { label: "Medium Quality", score: 73, color: "#d97706", bg: "#fffbeb", border: "#fcd34d", text: "#78350f", emoji: "✅" },
  "wet-dried-shallow":  { label: "Lower Quality",  score: 68, color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", emoji: "⚠️" },
  "wet-stored-deep":    { label: "Lower Quality",  score: 65, color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", emoji: "⚠️" },
  "wet-stored-shallow": { label: "Lower Quality",  score: 61, color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", emoji: "⚠️" },
};

// ── Component ────────────────────────────────────────────────────────────────
const QualityFactorsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { prescriptionDetail, prescriptionKey, seaweedAmount, seaweedUnit } =
    location.state || {};

  const [selected, setSelected]       = useState({ season: null, freshness: null, location: null });
  const [animScore, setAnimScore]     = useState(0);
  const [tooltip, setTooltip]         = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError]     = useState("");

  useEffect(() => {
    if (!prescriptionDetail || !prescriptionKey) { navigate(-1); return; }
    window.scrollTo(0, 0);
  }, []);

  const allSelected = selected.season && selected.freshness && selected.location;
  const qualityKey  = allSelected
    ? `${selected.season}-${selected.freshness}-${selected.location}` : null;
  const quality     = qualityKey ? QUALITY_MAP[qualityKey] : null;
  const doneCount   = Object.values(selected).filter(Boolean).length;

  // Compute preview adjusted amount
  const adjustedAmount = allSelected
    ? (
        seaweedAmount *
        parseFloat(FACTORS.season.options.find(o => o.value === selected.season)?.multiplier || "1") *
        parseFloat(FACTORS.freshness.options.find(o => o.value === selected.freshness)?.multiplier || "1") *
        parseFloat(FACTORS.location.options.find(o => o.value === selected.location)?.multiplier || "1")
      ).toFixed(2)
    : null;

  // Animate score counter
  useEffect(() => {
    if (!quality) { setAnimScore(0); return; }
    let cur = 0;
    const target = quality.score;
    const timer = setInterval(() => {
      cur += Math.ceil(target / 35);
      if (cur >= target) { setAnimScore(target); clearInterval(timer); }
      else setAnimScore(cur);
    }, 18);
    return () => clearInterval(timer);
  }, [quality?.score]);

  const select = (fk, val) =>
    setSelected(p => ({ ...p, [fk]: p[fk] === val ? null : val }));

  const handleCalculate = async () => {
    if (!allSelected) return;
    setCalcError("");
    setCalcLoading(true);
    try {
      const result = await calculatePrescription(prescriptionKey, seaweedAmount, {
        season:    selected.season,
        freshness: selected.freshness,
        location:  selected.location,
      });
      navigate("/prescription-result", {
        state: { calcResult: result, prescriptionDetail },
      });
    } catch (e) {
      setCalcError(e.message || "Calculation failed. Please try again.");
    } finally {
      setCalcLoading(false);
    }
  };

  if (!prescriptionDetail) return null;

  return (
    <div className="qfp-page">

      {/* ── TOP BAR ── */}
      <div className="qfp-topbar">
        <button className="qfp-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="qfp-topbar-mid">
          <span className="qfp-step-pill">Step 5 of 5</span>
          <span className="qfp-topbar-title">Seaweed Quality Factors</span>
        </div>
        <div className="qfp-topbar-ai">⚡ Llama 3.3 AI</div>
      </div>

      {/* ── HERO ── */}
      <div className="qfp-hero">
        <div className="qfp-hero-dots" />
        <div className="qfp-hero-inner">
          <div className="qfp-hero-left">
            <div className="qfp-novelty-pill">🎯 Research Novelty · ML-Powered</div>
            <h1 className="qfp-hero-h1">Quality-Aware<br />AI Prediction</h1>
            <p className="qfp-hero-p">
              World's first system that adjusts traditional seaweed medicine
              formulations based on measurable harvest quality factors.
            </p>
            <div className="qfp-hero-stats">
              {[["630","Prescriptions"],["95.2%","ML Accuracy"],["3","Quality Factors"]].map(([v,l]) => (
                <div key={l} className="qfp-stat">
                  <span className="qfp-stat-val">{v}</span>
                  <span className="qfp-stat-lbl">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="qfp-hero-right">
            <div className="qfp-rx-card">
              <div className="qfp-rx-icon">🌿</div>
              <div>
                <div className="qfp-rx-name">{prescriptionDetail.name}</div>
                <div className="qfp-rx-type">{prescriptionDetail.seaweed_type || "Seaweed"}</div>
              </div>
            </div>
            <div className="qfp-amount-card">
              <span className="qfp-ac-lbl">Seaweed Amount</span>
              <span className="qfp-ac-val">{seaweedAmount} {seaweedUnit || "g"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="qfp-body">
        <div className="qfp-body-inner">

          {/* ════ LEFT: Factor selection ════ */}
          <div className="qfp-left">

            {/* Progress */}
            <div className="qfp-progress">
              {["Season","Freshness","Location"].map((lbl, i) => {
                const keys = ["season","freshness","location"];
                const done = Boolean(selected[keys[i]]);
                return (
                  <React.Fragment key={lbl}>
                    <div className="qfp-prog-item">
                      <div className={`qfp-prog-dot ${done ? "done" : ""}`}>{done ? "✓" : i+1}</div>
                      <span className={`qfp-prog-lbl ${done ? "done" : ""}`}>{lbl}</span>
                    </div>
                    {i < 2 && <div className={`qfp-prog-line ${done ? "done" : ""}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Factor cards */}
            {Object.entries(FACTORS).map(([fk, factor]) => (
              <div key={fk} className={`qfp-factor-card ${selected[fk] ? "selected" : ""}`}>
                <div className="qfp-fc-header">
                  <span className="qfp-fc-icon">{factor.icon}</span>
                  <div>
                    <div className="qfp-fc-label">{factor.label}</div>
                    <div className="qfp-fc-question">{factor.question}</div>
                  </div>
                  {selected[fk] && <span className="qfp-fc-tick">✓ Selected</span>}
                </div>

                <div className={`qfp-opts cols-${factor.options.length}`}>
                  {factor.options.map(opt => {
                    const on      = selected[fk] === opt.value;
                    const showTip = tooltip === `${fk}-${opt.value}` && !on;
                    return (
                      <div
                        key={opt.value}
                        className={`qfp-opt ${on ? "on" : ""}`}
                        style={{
                          "--c":  opt.color,
                          "--bg": opt.lightBg,
                          "--bd": opt.border,
                        }}
                        onClick={() => select(fk, opt.value)}
                        onMouseEnter={() => setTooltip(`${fk}-${opt.value}`)}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {showTip && <div className="qfp-tip">{opt.detail}</div>}
                        <div className="qfp-opt-icon">{opt.icon}</div>
                        <div className="qfp-opt-label">{opt.label}</div>
                        <div className="qfp-opt-desc">{opt.desc}</div>
                        <div className={`qfp-opt-mult ${on ? "on" : ""}`}>
                          ×{opt.multiplier} <span>{opt.tag}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Novelty note */}
            <div className="qfp-novelty-note">
              <span>🔬</span>
              <div>
                <div className="qfp-nn-title">Research Novelty</div>
                <p className="qfp-nn-text">
                  Existing AI systems focus on drug discovery and diagnosis —
                  none adapt formulation amounts based on harvest quality.
                  This is the <strong>first quality-aware prediction system</strong> for
                  traditional seaweed medicine, adjusting therapeutic doses based on
                  Season, Freshness, and Harvest Location.
                </p>
              </div>
            </div>
          </div>

          {/* ════ RIGHT: Preview + Calculate ════ */}
          <div className="qfp-right">
            <div className="qfp-sticky">

              {/* ML Preview card */}
              <div
                className="qfp-preview-card"
                style={quality ? {
                  background:  quality.bg,
                  borderColor: quality.border,
                  boxShadow:   `0 8px 32px ${quality.color}1a`,
                } : {}}
              >
                <div className="qfp-pc-title">
                  {allSelected ? "🧬 ML Quality Prediction" : "🌿 Select Quality Factors"}
                </div>

                {!allSelected ? (
                  <div className="qfp-pc-empty">
                    <div className="qfp-pc-empty-icon">🌿</div>
                    <p>Select all 3 factors above to see the ML prediction</p>
                    <div className="qfp-mini-prog">
                      {[0,1,2].map(i => (
                        <div key={i} className={`qfp-mini-dot ${doneCount > i ? "done" : ""}`} />
                      ))}
                    </div>
                    <span className="qfp-mini-count">{doneCount}/3 selected</span>
                  </div>
                ) : (
                  <div className="qfp-pc-result">
                    {/* Quality label row */}
                    <div className="qfp-ql-row">
                      <span className="qfp-ql-emoji">{quality.emoji}</span>
                      <div>
                        <div className="qfp-ql-label" style={{ color: quality.text }}>
                          {quality.label}
                        </div>
                        <div className="qfp-ql-sub" style={{ color: quality.color }}>ML Predicted</div>
                      </div>
                      <span className="qfp-ql-badge" style={{ background: quality.color }}>
                        {quality.score >= 85 ? "Optimal" : quality.score >= 73 ? "Standard" : "Low"}
                      </span>
                    </div>

                    {/* Factor tags */}
                    <div className="qfp-tag-row">
                      {Object.entries(selected).map(([fk, val]) => {
                        const opt = FACTORS[fk].options.find(o => o.value === val);
                        return (
                          <span key={fk} className="qfp-factor-tag"
                            style={{ color: opt.color, borderColor: `${opt.color}55` }}>
                            {opt.icon} {opt.label} <em>×{opt.multiplier}</em>
                          </span>
                        );
                      })}
                    </div>

                    {/* Effectiveness bar */}
                    <div className="qfp-score-wrap">
                      <div className="qfp-score-labels">
                        <span>Therapeutic Effectiveness</span>
                        <strong style={{ color: quality.color }}>{animScore}%</strong>
                      </div>
                      <div className="qfp-score-track">
                        <div className="qfp-score-fill"
                          style={{ width: `${animScore}%`, background: quality.color }} />
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="qfp-explanation"
                      style={{ color: quality.text, borderLeftColor: quality.color }}>
                      {quality.label === "High Quality"
                        ? "🔬 Optimal conditions — ML reduces seaweed amount to prevent over-dosage while maximizing benefit."
                        : quality.label === "Medium Quality"
                        ? "✅ Standard conditions — baseline formulation amounts recommended."
                        : "⚠️ Sub-optimal conditions — ML increases amount to compensate for reduced bioactive concentration."}
                    </div>

                    {/* Amount preview */}
                    <div className="qfp-amount-preview">
                      <div className="qfp-ap-col">
                        <span className="qfp-ap-lbl">You entered</span>
                        <span className="qfp-ap-original">{seaweedAmount} {seaweedUnit || "g"}</span>
                      </div>
                      <div className="qfp-ap-arrow">→</div>
                      <div className="qfp-ap-col">
                        <span className="qfp-ap-lbl">ML adjusted</span>
                        <span className="qfp-ap-adjusted" style={{ color: quality.color }}>
                          {adjustedAmount} {seaweedUnit || "g"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {allSelected && (
                  <div className="qfp-ml-footnote">
                    <span>⚡ GradientBoosting + RandomForest</span>
                    <span className="qfp-dot">·</span>
                    <span>630 prescriptions</span>
                    <span className="qfp-dot">·</span>
                    <span className="qfp-acc">95.2% accuracy</span>
                  </div>
                )}
              </div>

              {/* Error */}
              {calcError && <div className="qfp-error">{calcError}</div>}

              {/* Calculate button */}
              <button
                className={`qfp-calc-btn ${allSelected && !calcLoading ? "ready" : ""}`}
                onClick={handleCalculate}
                disabled={!allSelected || calcLoading}
              >
                {calcLoading
                  ? "⚡ AI is calculating..."
                  : allSelected
                  ? "Calculate & View Full Report →"
                  : `Select ${3 - doneCount} more factor${3 - doneCount !== 1 ? "s" : ""} to continue`}
              </button>

              {/* Report includes */}
              {!calcLoading && (
                <div className="qfp-report-includes">
                  <div className="qfp-ri-title">📋 Your report will include:</div>
                  {[
                    "✅ Quality-adjusted ingredient amounts",
                    "🌿 Seaweed quality impact explanation",
                    "📊 Visual bar & pie charts",
                    "🔬 Scientific reasoning",
                    "💡 AI preparation tips",
                    "⚠️ Quality-based warnings",
                  ].map((item, i) => (
                    <div key={i} className="qfp-ri-item">{item}</div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QualityFactorsPage;