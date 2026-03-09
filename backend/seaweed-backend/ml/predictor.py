"""
AI Prescription Predictor — Inference Module
=============================================
Loads the trained model and provides predictions for the API.
"""

import os
import json
import joblib
import numpy as np

SAVE_DIR = os.path.join(os.path.dirname(__file__), "saved_models")


class PrescriptionPredictor:
    """
    Wraps the trained ML model for easy inference.
    Called by the Flask API routes.
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoders = None
        self.quality_clf = None
        self.meta = None
        self.lookup = None
        self._loaded = False

    def load(self):
        """Load all saved model artifacts from disk."""
        if self._loaded:
            return True
        try:
            self.model = joblib.load(os.path.join(SAVE_DIR, "ingredient_predictor.joblib"))
            self.scaler = joblib.load(os.path.join(SAVE_DIR, "feature_scaler.joblib"))
            self.encoders = joblib.load(os.path.join(SAVE_DIR, "label_encoders.joblib"))

            qc_path = os.path.join(SAVE_DIR, "quality_classifier.joblib")
            if os.path.exists(qc_path):
                self.quality_clf = joblib.load(qc_path)

            with open(os.path.join(SAVE_DIR, "model_meta.json")) as f:
                self.meta = json.load(f)

            with open(os.path.join(SAVE_DIR, "prescription_lookup.json")) as f:
                self.lookup = json.load(f)

            self._loaded = True
            return True
        except FileNotFoundError:
            return False

    def is_ready(self):
        return self._loaded

    def _encode_input(self, seaweed_type: str, health_category: str,
                      seaweed_amount: float, unit: str = "g"):
        """Encode a single input into a feature vector."""
        le_s = self.encoders["seaweed"]
        le_c = self.encoders["category"]
        le_u = self.encoders["unit"]

        # Handle unseen labels gracefully
        if seaweed_type not in le_s.classes_:
            seaweed_enc = 0
        else:
            seaweed_enc = le_s.transform([seaweed_type])[0]

        if health_category not in le_c.classes_:
            cat_enc = 0
        else:
            cat_enc = le_c.transform([health_category])[0]

        if unit not in le_u.classes_:
            unit_enc = 0
        else:
            unit_enc = le_u.transform([unit])[0]

        return np.array([[seaweed_enc, cat_enc, seaweed_amount, unit_enc]], dtype=float)

    def predict_ratios(self, seaweed_type: str, health_category: str,
                       seaweed_amount: float, unit: str = "g"):
        """
        Predict ingredient ratios for a given input.
        Returns a list of ratio floats (one per additional ingredient slot).
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load() first.")

        X = self._encode_input(seaweed_type, health_category, seaweed_amount, unit)
        X_scaled = self.scaler.transform(X)
        ratios = self.model.predict(X_scaled)[0]
        # Clip negative ratios to 0 (physically impossible)
        ratios = np.clip(ratios, 0, None)
        return ratios.tolist()

    def predict_quality(self, seaweed_type: str, health_category: str,
                        seaweed_amount: float, unit: str = "g",
                        min_dose: float = None, max_dose: float = None):
        """
        Predict quality label: 'optimal', 'too_low', 'too_high'.
        Falls back to rule-based if classifier not available.
        """
        if self.quality_clf is not None and self._loaded:
            X = self._encode_input(seaweed_type, health_category, seaweed_amount, unit)
            X_scaled = self.scaler.transform(X)
            label = self.quality_clf.predict(X_scaled)[0]
            proba = self.quality_clf.predict_proba(X_scaled)[0]
            classes = self.quality_clf.classes_
            confidence = float(max(proba))
            return {"label": label, "confidence": round(confidence, 3)}

        # Rule-based fallback
        if min_dose is not None and max_dose is not None:
            if seaweed_amount < min_dose:
                return {"label": "too_low", "confidence": 1.0}
            elif seaweed_amount > max_dose:
                return {"label": "too_high", "confidence": 1.0}
        return {"label": "optimal", "confidence": 1.0}

    def calculate_ingredients(self, prescription_key: str, seaweed_amount: float):
        """
        Given a prescription key (seaweed_type||name) and a user-entered
        seaweed amount, return calculated ingredient amounts using the ML model.

        Returns a dict with:
          - ingredients: list of {name, value, unit, calculated_amount}
          - quality: {label, confidence, message}
          - prescription: full prescription details
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded.")

        # Get prescription details from lookup
        prescription = self.lookup.get(prescription_key)
        if not prescription:
            raise ValueError(f"Prescription not found: {prescription_key}")

        seaweed_type = prescription["seaweed_type"]
        health_category = prescription["health_category"]
        ingredients = prescription["ingredients"]

        # Filter to ingredients that have numeric values
        valid_ingredients = [ing for ing in ingredients if "value" in ing]
        if not valid_ingredients:
            raise ValueError("No numeric ingredient data available.")

        # The first ingredient is the seaweed itself
        seaweed_ing = valid_ingredients[0]
        seaweed_unit = seaweed_ing.get("unit", "g")

        # Get ML-predicted ratios
        predicted_ratios = self.predict_ratios(
            seaweed_type, health_category, seaweed_amount, seaweed_unit
        )

        # Build result list for other ingredients
        calculated = []
        base_seaweed_val = seaweed_ing.get("value", 1.0)

        for i, ing in enumerate(valid_ingredients[1:]):
            # Use ML predicted ratio; fallback to CSV ratio if ML ratio is 0
            ml_ratio = predicted_ratios[i] if i < len(predicted_ratios) else 0
            csv_ratio = ing["value"] / base_seaweed_val if base_seaweed_val > 0 else 0

            # Blend: weighted average (70% ML, 30% CSV ratio for stability)
            effective_ratio = 0.7 * ml_ratio + 0.3 * csv_ratio if ml_ratio > 0 else csv_ratio

            calculated_amount = round(effective_ratio * seaweed_amount, 2)
            calculated.append({
                "name": ing["name"],
                "base_value": ing["value"],
                "base_unit": ing.get("unit", ""),
                "ratio": round(effective_ratio, 4),
                "calculated_amount": calculated_amount,
                "unit": ing.get("unit", ""),
            })

        # Quality assessment
        import re
        dose_raw = prescription.get("recommended_dose", "")
        nums = re.findall(r"[\d.]+", dose_raw)
        floats = [float(n) for n in nums if float(n) < 10000]
        min_dose = min(floats) if len(floats) >= 2 else (floats[0] if floats else None)
        max_dose = max(floats) if len(floats) >= 2 else (floats[0] if floats else None)

        quality = self.predict_quality(
            seaweed_type, health_category, seaweed_amount, seaweed_unit,
            min_dose=min_dose, max_dose=max_dose
        )

        # Enrich quality with user-friendly message
        quality_messages = {
            "optimal": f"✅ Your amount ({seaweed_amount}{seaweed_unit}) is within the optimal therapeutic range. Expected quality: Good.",
            "too_low": f"⚠️ Your amount ({seaweed_amount}{seaweed_unit}) is below the recommended minimum ({min_dose}{seaweed_unit}). The medicine may be less effective.",
            "too_high": f"⚠️ Your amount ({seaweed_amount}{seaweed_unit}) exceeds the recommended maximum ({max_dose}{seaweed_unit}). Risk of side effects. Please reduce.",
        }
        quality["message"] = quality_messages.get(quality["label"], "")
        quality["min_dose"] = min_dose
        quality["max_dose"] = max_dose
        quality["dose_unit"] = seaweed_unit

        return {
            "prescription": prescription,
            "seaweed_amount": seaweed_amount,
            "seaweed_unit": seaweed_unit,
            "calculated_ingredients": calculated,
            "quality": quality,
        }

    def get_all_prescriptions_by_seaweed(self, seaweed_type: str):
        """Return all prescriptions for a given seaweed type."""
        if not self._loaded:
            raise RuntimeError("Model not loaded.")
        return [
            v for k, v in self.lookup.items()
            if v["seaweed_type"] == seaweed_type
        ]

    def get_prescriptions_by_category(self, seaweed_type: str, health_category: str):
        """Return prescriptions filtered by seaweed and health category."""
        if not self._loaded:
            raise RuntimeError("Model not loaded.")
        return [
            v for k, v in self.lookup.items()
            if v["seaweed_type"] == seaweed_type
            and v["health_category"] == health_category
        ]

    def get_categories_for_seaweed(self, seaweed_type: str):
        """Return unique health categories available for a seaweed type."""
        if not self._loaded:
            raise RuntimeError("Model not loaded.")
        seen = set()
        categories = []
        for v in self.lookup.values():
            if v["seaweed_type"] == seaweed_type:
                cat = v["health_category"]
                if cat not in seen:
                    seen.add(cat)
                    categories.append(cat)
        return sorted(categories)


# Singleton instance (loaded once at app startup)
predictor = PrescriptionPredictor()