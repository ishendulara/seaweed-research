// frontend/src/pages/PrescriptionResult.js
// Result page — shown after AI calculation completes

import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend
} from "recharts";
import "./PrescriptionResult.css";

const BAR_COLORS = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ec4899","#06b6d4"];

// ── Quality factor display helpers ────────────────────────────────────────
const SEASON_LABELS    = { dry: "☀️ Dry Season",    wet: "🌧️ Wet Season" };
const FRESHNESS_LABELS = { fresh: "🌱 Fresh", dried: "🍂 Dried", stored: "📦 Stored" };
const LOCATION_LABELS  = { deep: "🌊 Deep Water", shallow: "🏖️ Shallow Water" };

const PrescriptionResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();

  const { calcResult, prescriptionDetail } = location.state || {};

  useEffect(() => {
    if (!calcResult || !prescriptionDetail) navigate(-1);
    window.scrollTo(0, 0);
  }, [calcResult, prescriptionDetail, navigate]);

  if (!calcResult || !prescriptionDetail) return null;

  const quality      = calcResult.quality_assessment || calcResult.quality || {};
  const ingredients  = Array.isArray(calcResult.calculated_ingredients)
    ? calcResult.calculated_ingredients : [];
  const qualityLabel = quality.label || "optimal";
  const score        = calcResult.effectiveness_score || 75;

  // ── Quality factors from backend ─────────────────────────────────────
  const qf              = calcResult.quality_factors || {};
  const hasQualityData  = Object.keys(qf).length > 0;
  const originalAmount  = qf.original_amount  ?? calcResult.seaweed_amount;
  const adjustedAmount  = qf.adjusted_amount  ?? calcResult.seaweed_amount;
  const multiplier      = qf.multiplier       ?? 1.0;
  const qualityInfo     = qf.quality_label    || {};
  const wasAdjusted     = Math.abs(originalAmount - adjustedAmount) > 0.01;

  // Chart data — use adjusted amount
  const barData = [
    {
      name: prescriptionDetail.ingredients[0]?.name?.split(" ").pop() || "Seaweed",
      amount: adjustedAmount,
      unit: calcResult.seaweed_unit,
    },
    ...ingredients.map(ing => ({
      name: ing.name.split(" ").pop(),
      amount: Number(ing.amount ?? ing.calculated_amount ?? 0),
      unit: ing.unit,
    }))
  ];

  const pieData = barData.map((d, i) => ({
    name: d.name,
    value: d.amount,
    unit: d.unit,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const scoreData = [{
    name: "Score", value: score,
    fill: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444"
  }];

  return (
    <div className="result-page" ref={printRef}>

      {/* ── Top Bar ── */}
      <div className="result-topbar no-print">
        <button className="result-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="result-topbar-title">
          <span className="result-ai-badge">⚡ Llama 3.3 AI Result</span>
        </div>
        <button className="result-print-btn" onClick={() => window.print()}>🖨️ Print Report</button>
      </div>

      {/* ── Hero Section ── */}
      <div className="result-hero">
        <div className="result-hero-bg" />
        <div className="result-hero-content">
          <div className="result-hero-left">
            <p className="result-hero-label">AI Prescription Report</p>
            <h1 className="result-hero-title">{prescriptionDetail.name}</h1>
            <p className="result-hero-sub">{prescriptionDetail.health_category_raw}</p>
            <div className="result-hero-tags">
              <span className="result-tag green">🌿 {prescriptionDetail.seaweed_type || "Seaweed"}</span>
              <span className={`result-tag ${qualityLabel === "optimal" ? "green" : "yellow"}`}>
                {qualityLabel === "optimal" ? "✅ Optimal Dose"
                  : qualityLabel === "too_low" ? "⬇️ Below Range" : "⬆️ Above Range"}
              </span>
              <span className="result-tag blue">⚡ AI Generated</span>
              {/* ── NEW: Quality tag ── */}
              {hasQualityData && (
                <span className={`result-tag ${
                  qualityInfo.color === "green" ? "green"
                  : qualityInfo.color === "red" ? "red" : "yellow"
                }`}>
                  {qualityInfo.emoji || "🌿"} {qualityInfo.label || "Quality Assessed"}
                </span>
              )}
            </div>
          </div>
          <div className="result-hero-right">
            <div className="result-score-circle">
              <ResponsiveContainer width={160} height={160}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                  startAngle={90} endAngle={90 - (score / 100) * 360} data={scoreData}>
                  <RadialBar dataKey="value" cornerRadius={10} fill={scoreData[0].fill} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="result-score-label">
                <span className="result-score-number">{score}%</span>
                <span className="result-score-text">Effectiveness</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="result-body">

        {/* ── NEW: Seaweed Quality Section ── */}
        {hasQualityData && (
          <div className="result-card result-quality-factors-card">
            <h3 className="result-card-title">🌿 Seaweed Quality Assessment</h3>

            {/* Quality Factors Row */}
            <div className="quality-factors-row">
              <div className="quality-factor-item">
                <span className="qf-icon">🌦️</span>
                <span className="qf-label">Harvest Season</span>
                <span className="qf-value">{SEASON_LABELS[qf.season] || qf.season}</span>
              </div>
              <div className="quality-factor-item">
                <span className="qf-icon">🌱</span>
                <span className="qf-label">Freshness</span>
                <span className="qf-value">{FRESHNESS_LABELS[qf.freshness] || qf.freshness}</span>
              </div>
              <div className="quality-factor-item">
                <span className="qf-icon">🌊</span>
                <span className="qf-label">Harvest Location</span>
                <span className="qf-value">{LOCATION_LABELS[qf.location] || qf.location}</span>
              </div>
              <div className="quality-factor-item highlight">
                <span className="qf-icon">{qualityInfo.emoji || "✅"}</span>
                <span className="qf-label">Overall Quality</span>
                <span className={`qf-value quality-${qualityInfo.color || "green"}`}>
                  {qualityInfo.label || "Good"}
                </span>
              </div>
            </div>

            {/* Amount Adjustment Box */}
            {wasAdjusted && (
              <div className="quality-adjustment-box">
                <div className="qa-header">
                  🔄 Quality-Based Amount Adjustment
                </div>
                <div className="qa-amounts">
                  <div className="qa-amount-item original">
                    <span className="qa-amount-label">Original Amount</span>
                    <span className="qa-amount-value">{originalAmount} {qf.unit}</span>
                    <span className="qa-amount-sub">You entered</span>
                  </div>
                  <div className="qa-arrow">→</div>
                  <div className="qa-amount-item adjusted">
                    <span className="qa-amount-label">Adjusted Amount</span>
                    <span className="qa-amount-value">{adjustedAmount} {qf.unit}</span>
                    <span className="qa-amount-sub">
                      {adjustedAmount < originalAmount ? "Reduced (high quality)" : "Increased (lower quality)"}
                    </span>
                  </div>
                  <div className="qa-multiplier">
                    <span className="qa-mult-label">Quality Multiplier</span>
                    <span className="qa-mult-value">×{multiplier}</span>
                  </div>
                </div>

                {/* AI Explanation */}
                {calcResult.quality_adjustment_explanation && (
                  <div className="qa-explanation">
                    <span>🔬</span>
                    <p>{calcResult.quality_adjustment_explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quality message */}
            {qualityInfo.message && (
              <div className={`quality-message-box quality-msg-${qualityInfo.color || "green"}`}>
                <span>{qualityInfo.emoji || "✅"}</span>
                <p>{qualityInfo.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Row 1: Quality Assessment + Scientific Reasoning */}
        <div className="result-row">

          <div className="result-card result-quality-card">
            <h3 className="result-card-title">📊 Quality Assessment</h3>
            <div className={`result-quality-badge ${qualityLabel}`}>
              <span>
                {qualityLabel === "optimal" ? "✅ Optimal Amount"
                  : qualityLabel === "too_low" ? "⚠️ Below Recommended"
                  : "⚠️ Above Recommended"}
              </span>
            </div>
            <p className="result-quality-message">{quality.message}</p>
            {quality.recommendation && (
              <div className="result-recommendation">
                <span>💡</span>
                <span>{quality.recommendation}</span>
              </div>
            )}
            <div className="result-dose-info">
              <div className="result-dose-item">
                <span className="result-dose-label">Your Amount</span>
                <span className="result-dose-value">
                  {adjustedAmount} {calcResult.seaweed_unit}
                </span>
              </div>
              <div className="result-dose-item">
                <span className="result-dose-label">Recommended</span>
                <span className="result-dose-value">
                  {prescriptionDetail.recommended_dose || "See label"}
                </span>
              </div>
            </div>
          </div>

          {/* Scientific Reasoning */}
          <div className="result-card result-science-card">
            <h3 className="result-card-title">🔬 Scientific Reasoning</h3>
            <div className="result-science-content">
              <div className="result-science-icon">🧬</div>
              <p>{calcResult.scientific_reasoning || "AI analysis complete."}</p>
            </div>
            <div className="result-model-badge">
              <span>⚡</span>
              <span>{calcResult.model || "Llama 3.3 70B (Groq)"}</span>
            </div>
          </div>

        </div>

        {/* Row 2: Ingredients Table + Pie Chart */}
        <div className="result-row">

          <div className="result-card">
            <h3 className="result-card-title">🧪 Calculated Ingredients</h3>
            <table className="result-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ingredient</th>
                  <th>Amount</th>
                  <th>AI Role</th>
                </tr>
              </thead>
              <tbody>
                <tr className="result-table-seaweed">
                  <td><span className="result-table-num">1</span></td>
                  <td>
                    <strong>{prescriptionDetail.ingredients[0]?.name}</strong>
                    <span className="result-table-sub">
                      {wasAdjusted
                        ? `Adjusted from ${originalAmount}${qf.unit} → ${adjustedAmount}${qf.unit}`
                        : "Your input"}
                    </span>
                  </td>
                  <td className="result-amount">{adjustedAmount} {calcResult.seaweed_unit}</td>
                  <td className="result-role">Base ingredient</td>
                </tr>
                {ingredients.map((ing, i) => (
                  <tr key={i}>
                    <td>
                      <span className="result-table-num"
                        style={{ background: BAR_COLORS[(i+1) % BAR_COLORS.length] }}>
                        {i+2}
                      </span>
                    </td>
                    <td>{ing.name}</td>
                    <td className="result-amount">
                      {ing.amount ?? ing.calculated_amount ?? "?"} {ing.unit}
                    </td>
                    <td className="result-role">{ing.role || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="result-card">
            <h3 className="result-card-title">🥧 Ingredient Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${v} ${p.payload.unit}`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Row 3: Bar Chart */}
        <div className="result-card result-chart-card">
          <h3 className="result-card-title">📊 Ingredient Amount Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top:10, right:20, left:0, bottom:5 }}>
              <XAxis dataKey="name" tick={{ fontSize:12, fontWeight:600 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip
                formatter={(v, n, p) => [`${v} ${p.payload.unit}`, "Amount"]}
                contentStyle={{ borderRadius:10, border:"2px solid #e5e7eb" }}
              />
              <Bar dataKey="amount" radius={[8,8,0,0]}>
                {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Row 4: Tips + Warnings */}
        <div className="result-row">

          {calcResult.preparation_tips?.length > 0 && (
            <div className="result-card result-tips-card">
              <h3 className="result-card-title">💡 AI Preparation Tips</h3>
              <ul className="result-tips-list">
                {calcResult.preparation_tips.map((tip, i) => (
                  <li key={i}>
                    <span className="result-tip-num">{i+1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {calcResult.warnings?.length > 0 && (
            <div className="result-card result-warnings-card">
              <h3 className="result-card-title">⚠️ AI Warnings</h3>
              <ul className="result-warnings-list">
                {calcResult.warnings.map((w, i) => (
                  <li key={i}><span>⚠️</span><span>{w}</span></li>
                ))}
              </ul>
              {prescriptionDetail.contraindications && (
                <div className="result-contraindication">
                  <strong>Contraindications:</strong> {prescriptionDetail.contraindications}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Preparation Steps */}
        {prescriptionDetail.preparation_steps?.length > 0 && (
          <div className="result-card">
            <h3 className="result-card-title">👨‍🍳 Preparation Steps</h3>
            <div className="result-steps">
              {prescriptionDetail.preparation_steps.map((s, i) => (
                <div key={i} className="result-step">
                  <div className="result-step-num">{i+1}</div>
                  <p>{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="result-footer no-print">
          <button className="result-back-btn-lg" onClick={() => navigate(-1)}>← Calculate Again</button>
          <button className="result-print-btn-lg" onClick={() => window.print()}>🖨️ Print Full Report</button>
        </div>

      </div>
    </div>
  );
};

export default PrescriptionResult;