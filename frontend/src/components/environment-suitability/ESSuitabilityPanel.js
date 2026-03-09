import React from "react";
import ESCard from "./ESCard";
import ESBadge from "./ESBadge";
import { METRICS, statusForMetric, suitabilityScore } from "../../utils/sensorRanges";

function labelForStatus(s) {
  if (s === "safe") return "Optimal";
  if (s === "warning") return "Stable";
  if (s === "danger") return "Critical";
  return "—";
}

function toneForStatus(s) {
  if (s === "safe") return "safe";
  if (s === "warning") return "warning";
  if (s === "danger") return "danger";
  return "unknown";
}

export default function ESSuitabilityPanel({ reading }) {
  const score = suitabilityScore(reading);
  const band = score >= 75 ? "High Suitability" : score >= 50 ? "Moderate Suitability" : "Low Suitability";
  const bandTone = score >= 75 ? "safe" : score >= 50 ? "warning" : "danger";

  const statuses = [
    ["temperature", "Temperature"],
    ["ph", "pH"],
    ["tds", "TDS"],
    ["light", "Light"]
  ].map(([k, label]) => {
    const s = statusForMetric(k, reading?.[k]);
    return { key: k, label, s };
  });

  return (
    <div className="es-suitability-grid">
      <ESCard
        title="Environmental Suitability Analysis"
        subtitle="Score starts at 100. Subtract 25 for each metric outside the safe range."
      >
        <div className="es-suitability-score-container">
          <div>
            <div className="es-suitability-score">{score}%</div>
            <div className="es-suitability-band">
              <ESBadge tone={bandTone}>{band}</ESBadge>
            </div>
          </div>
          <div className="es-suitability-zones">
            <div className="es-suitability-zones-title">Safe zones</div>
            <div className="es-suitability-zones-list">
              <div>Temp: {METRICS.temperature.safe[0]}–{METRICS.temperature.safe[1]} °C</div>
              <div>pH: {METRICS.ph.safe[0]}–{METRICS.ph.safe[1]}</div>
              <div>TDS: {METRICS.tds.safe[0]}–{METRICS.tds.safe[1]} ppm</div>
              <div>Light: {METRICS.light.safe[0]}–{METRICS.light.safe[1]} lux</div>
            </div>
          </div>
        </div>
      </ESCard>

      <ESCard title="Environmental Status Indicators" subtitle="Instant qualitative interpretation of current conditions">
        <div className="es-status-indicators">
          {statuses.map((row) => (
            <div key={row.key} className="es-status-row">
              <div className="es-status-label">{row.label}</div>
              <div className="es-status-value">
                <span className="es-status-text">{labelForStatus(row.s)}</span>
                <ESBadge tone={toneForStatus(row.s)}>
                  {row.s === "safe" ? "Optimal" : row.s === "warning" ? "Warning" : row.s === "danger" ? "Danger" : "—"}
                </ESBadge>
              </div>
            </div>
          ))}
        </div>
      </ESCard>
    </div>
  );
}
