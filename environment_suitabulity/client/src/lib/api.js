const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text || path}`);
  }
  return res.json();
}

export function getLatest(tankId) {
  return apiGet(`/api/latest/${encodeURIComponent(tankId)}`);
}

export function getHistory24h(tankId) {
  return apiGet(`/api/history/${encodeURIComponent(tankId)}`);
}

export { API_BASE };

