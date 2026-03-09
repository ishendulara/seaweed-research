import React from "react";
import { TANKS } from "../../utils/sensorRanges";

export default function ESTankSelector({ value, onChange }) {
  return (
    <div className="es-tank-selector">
      <div className="es-tank-selector-label">Micro-Site Selection</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="es-tank-selector-select"
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
