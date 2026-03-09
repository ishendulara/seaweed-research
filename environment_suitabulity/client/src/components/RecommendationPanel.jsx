import React, { useMemo } from "react";
import Card from "./Card.jsx";
import Badge from "./Badge.jsx";
import { TANKS, suitabilityScore, statusForMetric } from "../lib/ranges.js";

function bestTank(latestByTank) {
  const rows = TANKS.map((t) => {
    const r = latestByTank?.[t.id] || null;
    return { tankId: t.id, label: t.label, reading: r, score: suitabilityScore(r) };
  });
  rows.sort((a, b) => b.score - a.score);
  return rows[0] || { tankId: "TankA", label: "Tank A", reading: null, score: 0 };
}

function reasonFromReading(r) {
  if (!r) return "Waiting for sensor data.";
  const good = [];
  if (statusForMetric("temperature", r.temperature) === "safe") good.push("temperature");
  if (statusForMetric("tds", r.tds) === "safe") good.push("salinity (TDS)");
  if (statusForMetric("ph", r.ph) === "safe") good.push("pH");
  if (statusForMetric("light", r.light) === "safe") good.push("light");
  if (good.length === 0) return "Requires adjustment to reach safe ranges.";
  if (good.length === 1) return `Strong ${good[0]} conditions.`;
  if (good.length === 2) return `Optimal ${good[0]} and ${good[1]}.`;
  return `Optimal ${good.slice(0, 2).join(" and ")} with stable overall conditions.`;
}

export default function RecommendationPanel({ latestByTank }) {
  const best = useMemo(() => bestTank(latestByTank), [latestByTank]);
  const reason = useMemo(() => reasonFromReading(best.reading), [best.reading]);

  return (
    <Card title="Micro-Site Recommendation" subtitle="Best tank based on latest suitability score">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Best Micro-Site: <span className="text-emerald-200">{best.label}</span>
            </div>
            <div className="mt-1 text-xs text-slate-300">
              <span className="text-slate-200">Reason:</span> {reason}
            </div>
          </div>
          <Badge tone={best.score >= 75 ? "safe" : best.score >= 50 ? "warning" : "danger"}>
            {best.score}%
          </Badge>
        </div>
      </div>
    </Card>
  );
}

