import React from "react";
import Card from "./Card.jsx";
import Badge from "./Badge.jsx";
import { TANKS, suitabilityScore } from "../lib/ranges.js";

function scoreTone(score) {
  if (score >= 75) return "safe";
  if (score >= 50) return "warning";
  if (score > 0) return "danger";
  return "neutral"; // දත්ත නොමැති විට
}

export default function TankComparisonTable({ latestByTank }) {
  // Snapshot දත්ත මත පදනම්ව පේළි සකස් කිරීම
  const rows = TANKS.map((t) => {
    const r = latestByTank?.[t.id] || null;
    const score = r ? suitabilityScore(r) : 0;
    return { tankId: t.id, label: t.label, reading: r, score };
  }).sort((a, b) => b.score - a.score);

  const best = rows[0]?.tankId;

  return (
    <Card 
      title="Micro-Site Comparison (Submitted Data)" 
      subtitle="Data will only appear here after you click 'Submit Tank Data'"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4 font-medium">Micro-Site</th>
              <th className="py-3 pr-4 font-medium">Temperature (°C)</th>
              <th className="py-3 pr-4 font-medium">pH</th>
              <th className="py-3 pr-4 font-medium">TDS (ppm)</th>
              <th className="py-3 pr-4 font-medium">Light (lux)</th>
              <th className="py-3 pr-2 font-medium">Suitability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const r = row.reading;
              const isBest = r && row.tankId === best && row.score > 0;
              return (
                <tr
                  key={row.tankId}
                  className={[
                    "border-b border-white/5 transition-colors",
                    isBest ? "bg-emerald-500/10" : "hover:bg-white/5"
                  ].join(" ")}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-slate-100">{row.label}</div>
                      {isBest ? <Badge tone="safe">Best</Badge> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-200">
                    {r ? r.temperature?.toFixed(2) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-slate-200">
                    {r ? r.ph?.toFixed(2) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-slate-200">
                    {r ? r.tds?.toFixed(0) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-slate-200">
                    {r ? r.light?.toFixed(0) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 pr-2">
                    {r ? (
                      <Badge tone={scoreTone(row.score)}>{row.score}%</Badge>
                    ) : (
                      <span className="text-xs text-slate-600 italic">No record</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}