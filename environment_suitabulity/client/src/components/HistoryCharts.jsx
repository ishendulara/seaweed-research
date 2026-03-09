import React, { useMemo } from "react";
import Card from "./Card.jsx";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

function buildDataset(history, key, label, color) {
  return {
    label,
    data: history.map((h) => ({ x: new Date(h.timestamp).toLocaleTimeString(), y: h[key] })),
    borderColor: color,
    backgroundColor: color,
    tension: 0.3,
    pointRadius: 0,
    borderWidth: 2
  };
}

export default function HistoryCharts({ history }) {
  const data = useMemo(() => {
    const h = Array.isArray(history) ? history : [];
    return {
      labels: h.map((x) => new Date(x.timestamp).toLocaleTimeString()),
      datasets: [
        buildDataset(h, "temperature", "Temperature (°C)", "rgba(52, 211, 153, 0.9)"),
        buildDataset(h, "ph", "pH", "rgba(59, 130, 246, 0.9)"),
        buildDataset(h, "tds", "TDS (ppm)", "rgba(251, 191, 36, 0.9)"),
        buildDataset(h, "light", "Light (lux)", "rgba(244, 114, 182, 0.9)")
      ]
    };
  }, [history]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: "rgba(226, 232, 240, 0.9)", boxWidth: 10, boxHeight: 10 }
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          ticks: { color: "rgba(148, 163, 184, 0.9)", maxTicksLimit: 8 },
          grid: { color: "rgba(148, 163, 184, 0.08)" }
        },
        y: {
          ticks: { color: "rgba(148, 163, 184, 0.9)" },
          grid: { color: "rgba(148, 163, 184, 0.08)" }
        }
      }
    }),
    []
  );

  return (
    <Card title="Last 24h Trends" subtitle="History data from /api/history/:tankId">
      <div className="h-72">
        <Line data={data} options={options} />
      </div>
    </Card>
  );
}

