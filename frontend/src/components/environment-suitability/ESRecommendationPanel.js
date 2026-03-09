import React, { useMemo } from "react";
import ESCard from "./ESCard";
import ESBadge from "./ESBadge";
import { TANKS, suitabilityScore, statusForMetric } from "../../utils/sensorRanges";

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

export default function ESRecommendationPanel({ latestByTank }) {
  const best = useMemo(() => bestTank(latestByTank), [latestByTank]);
  const reason = useMemo(() => reasonFromReading(best.reading), [best.reading]);

  return (
    <ESCard title="Micro-Site Recommendation" subtitle="Best tank based on latest suitability score">
      <div className="es-recommendation-box">
        <div className="es-recommendation-content">
          <div>
            <div className="es-recommendation-title">
              Best Micro-Site: <span className="es-recommendation-highlight">{best.label}</span>
            </div>
            <div className="es-recommendation-reason">
              <span>Reason:</span> {reason}
            </div>
          </div>
          <ESBadge tone={best.score >= 75 ? "safe" : best.score >= 50 ? "warning" : "danger"}>
            {best.score}%
          </ESBadge>
        </div>
      </div>
    </ESCard>
  );
}
