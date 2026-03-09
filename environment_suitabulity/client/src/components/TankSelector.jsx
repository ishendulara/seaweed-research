import React from "react";
import { TANKS } from "../lib/ranges.js";

export default function TankSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs font-medium text-slate-300">Micro-Site Selection</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 outline-none ring-emerald-400/30 focus:ring-2"
      >
        {TANKS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

