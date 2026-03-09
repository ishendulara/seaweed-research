import React, { useMemo } from "react";
import GaugeChart from "react-gauge-chart";
import ESCard from "./ESCard";
import ESBadge from "./ESBadge";
import { METRICS, clamp, statusForMetric } from "../../utils/sensorRanges";

function toneToLabel(tone) {
  if (tone === "safe") return "Safe";
  if (tone === "warning") return "Warning";
  if (tone === "danger") return "Danger";
  return "—";
}

export default function ESGaugeCard({ metricKey, value, minMax24h }) {
  const m = METRICS[metricKey];
  const v = typeof value === "number" ? value : null;
  const tone = statusForMetric(metricKey, v);

  const percent = useMemo(() => {
    if (v == null) return 0;
    const clamped = clamp(v, m.min, m.max);
    return (clamped - m.min) / (m.max - m.min);
  }, [v, m.min, m.max]);

  const arc = useMemo(() => {
    const safeSpan = (m.safe[1] - m.safe[0]) / (m.max - m.min);
    const warnSpan = (m.warn[1] - m.warn[0]) / (m.max - m.min);
    const danger = Math.max(0.12, (1 - warnSpan) / 2);
    const safe = Math.max(0.18, Math.min(0.5, safeSpan));
    const warning = Math.max(0.12, 1 - danger - safe);
    const sum = danger + warning + safe;
    return { limits: [danger / sum, warning / sum, safe / sum], colors: ["#fb7185", "#fbbf24", "#34d399"] };
  }, [m.max, m.min, m.safe, m.warn]);

  return (
    <ESCard
      title={m.label}
      subtitle={`Range: ${m.min}–${m.max} ${m.unit}`.trim()}
      right={<ESBadge tone={tone}>{toneToLabel(tone)}</ESBadge>}
      className="es-gauge-card-wrapper"
    >
      <div className="es-gauge-container">
        <div className="es-gauge-tooltip">
          <div className="es-gauge-tooltip-header">
            <div className="es-gauge-tooltip-title">{m.label} (24h)</div>
            <ESBadge tone={tone}>{toneToLabel(tone)}</ESBadge>
          </div>
          <div className="es-gauge-tooltip-grid">
            <div className="es-gauge-tooltip-cell">
              <div className="es-gauge-tooltip-label">Min</div>
              <div className="es-gauge-tooltip-value">
                {minMax24h?.min == null ? "—" : `${minMax24h.min.toFixed(2)} ${m.unit}`.trim()}
              </div>
            </div>
            <div className="es-gauge-tooltip-cell">
              <div className="es-gauge-tooltip-label">Max</div>
              <div className="es-gauge-tooltip-value">
                {minMax24h?.max == null ? "—" : `${minMax24h.max.toFixed(2)} ${m.unit}`.trim()}
              </div>
            </div>
          </div>
          <div className="es-gauge-tooltip-safe">
            Safe zone: {m.safe[0]}–{m.safe[1]} {m.unit}
          </div>
        </div>
        <div className="es-gauge-chart">
          <GaugeChart
            id={`gauge-${metricKey}`}
            nrOfLevels={3}
            arcsLength={arc.limits}
            colors={arc.colors}
            percent={percent}
            arcPadding={0.02}
            cornerRadius={3}
            animate={false}
            needleColor="#e2e8f0"
            needleBaseColor="#0f172a"
            hideText
            marginInPercent={0.05}
          />
        </div>
        <div className="es-gauge-footer">
          <div>
            <div className="es-gauge-value">
              {v == null ? "—" : v.toFixed(2)}
              <span className="es-gauge-unit">{m.unit}</span>
            </div>
            <div className="es-gauge-safe-label">Safe {m.safe[0]}–{m.safe[1]} {m.unit}</div>
          </div>
          <div className="es-gauge-legend">
            <div>Green: Safe</div>
            <div>Yellow: Warning</div>
            <div>Red: Danger</div>
          </div>
        </div>
      </div>
    </ESCard>
  );
}
