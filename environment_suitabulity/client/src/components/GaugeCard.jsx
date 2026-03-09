import React, { useMemo } from "react";
import GaugeChart from "react-gauge-chart";
import Card from "./Card.jsx";
import Badge from "./Badge.jsx";
import { METRICS, clamp, statusForMetric } from "../lib/ranges.js";

function toneToLabel(tone) {
  if (tone === "safe") return "Safe";
  if (tone === "warning") return "Warning";
  if (tone === "danger") return "Danger";
  return "—";
}

export default function GaugeCard({ metricKey, value, minMax24h }) {
  const m = METRICS[metricKey];
  const v = typeof value === "number" ? value : null;
  const tone = statusForMetric(metricKey, v);

  const percent = useMemo(() => {
    if (v == null) return 0;
    const clamped = clamp(v, m.min, m.max);
    return (clamped - m.min) / (m.max - m.min);
  }, [v, m.min, m.max]);

  const arc = useMemo(() => {
    // 3 arcs: danger | warning | safe (center band)
    // We map "safe band width" based on safe-range proportion. The remainder becomes warning/danger.
    const safeSpan = (m.safe[1] - m.safe[0]) / (m.max - m.min);
    const warnSpan = (m.warn[1] - m.warn[0]) / (m.max - m.min);

    // conservative split: danger (outside warn), warning (warn but outside safe), safe (inside safe)
    const danger = Math.max(0.12, (1 - warnSpan) / 2);
    const safe = Math.max(0.18, Math.min(0.5, safeSpan));
    const warning = Math.max(0.12, 1 - danger - safe);
    const sum = danger + warning + safe;
    return { limits: [danger / sum, warning / sum, safe / sum], colors: ["#fb7185", "#fbbf24", "#34d399"] };
  }, [m.max, m.min, m.safe, m.warn]);

  const tooltip = (
    <div className="pointer-events-none absolute left-1/2 top-2 z-10 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/95 p-3 text-xs text-slate-200 opacity-0 shadow-soft backdrop-blur transition group-hover:opacity-100">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-100">{m.label} (24h)</div>
        <Badge tone={tone}>{toneToLabel(tone)}</Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 p-2">
          <div className="text-[11px] text-slate-400">Min</div>
          <div className="mt-1 font-semibold">
            {minMax24h?.min == null ? "—" : `${minMax24h.min.toFixed(2)} ${m.unit}`.trim()}
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <div className="text-[11px] text-slate-400">Max</div>
          <div className="mt-1 font-semibold">
            {minMax24h?.max == null ? "—" : `${minMax24h.max.toFixed(2)} ${m.unit}`.trim()}
          </div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-slate-400">
        Safe zone: {m.safe[0]}–{m.safe[1]} {m.unit}
      </div>
    </div>
  );

  return (
    <Card
      title={m.label}
      subtitle={`Range: ${m.min}–${m.max} ${m.unit}`.trim()}
      right={<Badge tone={tone}>{toneToLabel(tone)}</Badge>}
      className="relative"
    >
      <div className="group relative">
        {tooltip}
        <div className="h-40">
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
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-slate-100">
              {v == null ? "—" : v.toFixed(2)}
              <span className="ml-1 text-sm font-medium text-slate-400">{m.unit}</span>
            </div>
            <div className="text-xs text-slate-400">Safe {m.safe[0]}–{m.safe[1]} {m.unit}</div>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <div>Green: Safe</div>
            <div>Yellow: Warning</div>
            <div>Red: Danger</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

