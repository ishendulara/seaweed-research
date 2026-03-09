import React from "react";
import Card from "./Card.jsx";
import Badge from "./Badge.jsx";
import { METRICS, statusForMetric, suitabilityScore } from "../lib/ranges.js";

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

export default function SuitabilityPanel({ reading }) {
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
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Environmental Suitability Analysis"
        subtitle="Score starts at 100. Subtract 25 for each metric outside the safe range."
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-semibold text-slate-100">{score}%</div>
            <div className="mt-2">
              <Badge tone={bandTone}>{band}</Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">Safe zones</div>
            <div className="mt-2 grid gap-1 text-xs text-slate-200">
              <div>
                Temp: {METRICS.temperature.safe[0]}–{METRICS.temperature.safe[1]} °C
              </div>
              <div>
                pH: {METRICS.ph.safe[0]}–{METRICS.ph.safe[1]}
              </div>
              <div>
                TDS: {METRICS.tds.safe[0]}–{METRICS.tds.safe[1]} ppm
              </div>
              <div>
                Light: {METRICS.light.safe[0]}–{METRICS.light.safe[1]} lux
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Environmental Status Indicators" subtitle="Instant qualitative interpretation of current conditions">
        <div className="grid gap-3">
          {statuses.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="text-sm font-medium text-slate-100">{row.label}</div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-300">{labelForStatus(row.s)}</div>
                <Badge tone={toneForStatus(row.s)}>
                  {row.s === "safe" ? "Optimal" : row.s === "warning" ? "Warning" : row.s === "danger" ? "Danger" : "—"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

