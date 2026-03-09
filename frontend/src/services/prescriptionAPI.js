// frontend/src/services/prescriptionAPI.js
// ============================================================
// Connects the AI Prescription Calculator React frontend
// to the Flask backend API.
// ============================================================

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// ──────────────────────────────────────────────────────────────
// SEAWEED TYPES
// ──────────────────────────────────────────────────────────────

/**
 * Fetch all available seaweed types.
 * GET /api/calculator/seaweeds
 */
export async function getSeaweedTypes() {
  const res = await fetch(`${BASE_URL}/calculator/seaweeds`);
  if (!res.ok) throw new Error("Failed to fetch seaweed types");
  return res.json();
}

// ──────────────────────────────────────────────────────────────
// HEALTH CATEGORIES
// ──────────────────────────────────────────────────────────────

/**
 * Fetch broad health categories for a seaweed type.
 * GET /api/calculator/prescriptions?seaweed=Gracilaria+Edulis
 */
export async function getHealthCategories(seaweedType) {
  const res = await fetch(
    `${BASE_URL}/calculator/prescriptions?seaweed=${encodeURIComponent(seaweedType)}`
  );
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return data.categories; // string[]
}

// ──────────────────────────────────────────────────────────────
// PRESCRIPTIONS LIST
// ──────────────────────────────────────────────────────────────

/**
 * Fetch prescriptions filtered by seaweed + optional category.
 * GET /api/calculator/prescriptions?seaweed=...&category=...
 */
export async function getPrescriptions(seaweedType, category = null) {
  let url = `${BASE_URL}/calculator/prescriptions?seaweed=${encodeURIComponent(seaweedType)}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prescriptions");
  const data = await res.json();
  return data.prescriptions; // array of slim prescription objects
}

// ──────────────────────────────────────────────────────────────
// PRESCRIPTION DETAIL
// ──────────────────────────────────────────────────────────────

/**
 * Fetch full details of a single prescription by its key.
 * GET /api/calculator/detail?key=Gracilaria+Edulis||Name
 */
export async function getPrescriptionDetail(key) {
  const res = await fetch(
    `${BASE_URL}/calculator/detail?key=${encodeURIComponent(key)}`
  );
  if (!res.ok) throw new Error("Prescription not found");
  return res.json();
}

// ──────────────────────────────────────────────────────────────
// AI CALCULATOR — CORE FUNCTION
// ──────────────────────────────────────────────────────────────

/**
 * Call the AI prescription calculator.
 * POST /api/calculator/calculate
 *
 * @param {string} prescriptionKey  e.g. "Gracilaria Edulis||Gracilaria Digestive Kashaya"
 * @param {number} seaweedAmount    Amount of seaweed in grams
 * @param {object} qualityFactors   Seaweed quality factors
 * @param {string} qualityFactors.season    "dry" | "wet"
 * @param {string} qualityFactors.freshness "fresh" | "dried" | "stored"
 * @param {string} qualityFactors.location  "deep" | "shallow"
 *
 * @returns {Promise<{
 *   prescription: object,
 *   seaweed_amount: number,
 *   seaweed_unit: string,
 *   calculated_ingredients: Array<{name, amount, unit, role}>,
 *   quality_factors: object,
 *   quality_assessment: object,
 *   quality_adjustment_explanation: string,
 *   scientific_reasoning: string,
 *   preparation_tips: string[],
 *   warnings: string[],
 *   effectiveness_score: number
 * }>}
 */
export async function calculatePrescription(prescriptionKey, seaweedAmount, qualityFactors = {}) {
  const {
    season    = "wet",
    freshness = "dried",
    location  = "shallow",
  } = qualityFactors;

  const res = await fetch(`${BASE_URL}/calculator/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prescription_key: prescriptionKey,
      seaweed_amount:   seaweedAmount,
      // ── NEW: Seaweed quality factors ──
      season,
      freshness,
      location,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Calculation failed");
  }
  return res.json();
}

// ──────────────────────────────────────────────────────────────
// ML MODEL STATUS
// ──────────────────────────────────────────────────────────────

/**
 * Check if the ML model is trained and ready.
 * GET /api/ml/status
 */
export async function getModelStatus() {
  const res = await fetch(`${BASE_URL}/ml/status`);
  return res.json();
}