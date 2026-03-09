const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text || path}`);
  }
  return res.json();
}

export function getLatest(tankId) {
  return apiGet(`/api/sensor-data/latest/${encodeURIComponent(tankId)}`);
}

export function getHistory24h(tankId) {
  return apiGet(`/api/sensor-data/history/${encodeURIComponent(tankId)}`);
}

export function postSensorData(data) {
  return fetch(`${API_BASE}/api/sensor-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export { API_BASE };
