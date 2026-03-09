export const TANKS = [
  { id: "TankA", label: "Tank A" },
  { id: "TankB", label: "Tank B" },
  { id: "TankC", label: "Tank C" }
];

export const METRICS = {
  temperature: {
    label: "Temperature",
    unit: "°C",
    min: 0,
    max: 40,
    safe: [24, 30],
    warn: [22, 32]
  },
  ph: {
    label: "pH",
    unit: "",
    min: 0,
    max: 14,
    safe: [7.5, 8.5],
    warn: [7.0, 9.0]
  },
  tds: {
    label: "TDS",
    unit: "ppm",
    min: 0,
    max: 2000,
    safe: [800, 1500],
    warn: [650, 1650]
  },
  light: {
    label: "Light",
    unit: "lux",
    min: 0,
    max: 10000,
    safe: [2000, 8000],
    warn: [1500, 8500]
  }
};

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function statusForMetric(metricKey, value) {
  const m = METRICS[metricKey];
  if (value == null || Number.isNaN(value)) return "unknown";
  if (value < m.warn[0] || value > m.warn[1]) return "danger";
  if (value < m.safe[0] || value > m.safe[1]) return "warning";
  return "safe";
}

export function suitabilityScore(reading) {
  if (!reading) return 0;
  let score = 100;
  for (const k of ["temperature", "ph", "tds", "light"]) {
    const m = METRICS[k];
    const v = reading[k];
    if (typeof v !== "number") {
      score -= 25;
      continue;
    }
    if (v < m.safe[0] || v > m.safe[1]) score -= 25;
  }
  return Math.max(0, score);
}
