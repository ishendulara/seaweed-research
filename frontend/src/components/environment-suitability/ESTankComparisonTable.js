import React from "react";
import ESCard from "./ESCard";
import ESBadge from "./ESBadge";
import { TANKS, suitabilityScore } from "../../utils/sensorRanges";

function scoreTone(score) {
  if (score >= 75) return "safe";
  if (score >= 50) return "warning";
  if (score > 0) return "danger";
  return "unknown";
}

export default function ESTankComparisonTable({ latestByTank }) {
  const rows = TANKS.map((t) => {
    const r = latestByTank?.[t.id] || null;
    const score = r ? suitabilityScore(r) : 0;
    return { tankId: t.id, label: t.label, reading: r, score };
  }).sort((a, b) => b.score - a.score);

  const best = rows[0]?.tankId;

  return (
    <ESCard
      title="Micro-Site Comparison (Submitted Data)"
      subtitle="Data will only appear here after you click 'Submit Tank Data'"
    >
      <div className="es-table-container">
        <table className="es-table">
          <thead>
            <tr>
              <th>Micro-Site</th>
              <th>Temperature (°C)</th>
              <th>pH</th>
              <th>TDS (ppm)</th>
              <th>Light (lux)</th>
              <th>Suitability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const r = row.reading;
              const isBest = r && row.tankId === best && row.score > 0;
              return (
                <tr key={row.tankId} className={isBest ? "es-table-best-row" : ""}>
                  <td>
                    <div className="es-table-tank-cell">
                      <span>{row.label}</span>
                      {isBest ? <ESBadge tone="safe">Best</ESBadge> : null}
                    </div>
                  </td>
                  <td>{r ? r.temperature?.toFixed(2) : <span className="es-no-data">—</span>}</td>
                  <td>{r ? r.ph?.toFixed(2) : <span className="es-no-data">—</span>}</td>
                  <td>{r ? r.tds?.toFixed(0) : <span className="es-no-data">—</span>}</td>
                  <td>{r ? r.light?.toFixed(0) : <span className="es-no-data">—</span>}</td>
                  <td>
                    {r ? (
                      <ESBadge tone={scoreTone(row.score)}>{row.score}%</ESBadge>
                    ) : (
                      <span className="es-no-data-italic">No record</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ESCard>
  );
}
