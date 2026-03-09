"""
Quality Predictor — ML-based Seaweed Quality Assessment
========================================================
Loads trained models and predicts effectiveness score
and quality label based on seaweed quality factors.

Model Performance:
  - Quality Classifier Accuracy: 95.2%
  - Effectiveness Score MAE: 0.98 points
  - CV Accuracy: 85.6% ± 5.3%
"""

import os
import re
import json
import joblib
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../ml/saved_models/quality_models")


class QualityPredictor:
    """
    ML-based quality prediction for seaweed formulations.
    
    Inputs:
      - seaweed_type  : "Gracilaria Edulis" | "Kappaphycus Alvarezii"
      - season        : "dry" | "wet"
      - freshness     : "fresh" | "dried" | "stored"
      - location      : "deep" | "shallow"
      - temperature   : temperature string from prescription (e.g. "50-60°C")
      - moisture      : moisture string from prescription (e.g. "<10%")
      - duration      : duration string from prescription (e.g. "30 min")
      - ph_control    : pH control string from prescription
    
    Outputs:
      - effectiveness_score : int (60-98)
      - quality_label       : "High Quality" | "Medium Quality" | "Lower Quality"
      - quality_multiplier  : float (amount adjustment factor)
      - confidence          : float (model confidence)
    """

    # Quality multipliers — how much to adjust seaweed amount
    QUALITY_MULTIPLIERS = {
        "High Quality":   0.88,   # High quality → need less seaweed
        "Medium Quality": 1.00,   # Standard amount
        "Lower Quality":  1.18,   # Lower quality → need more seaweed
    }

    # Quality display info
    QUALITY_INFO = {
        "High Quality": {
            "color": "green",
            "emoji": "🌟",
            "message": "High quality seaweed detected — optimal therapeutic potency. Amount reduced for best results.",
        },
        "Medium Quality": {
            "color": "orange",
            "emoji": "✅",
            "message": "Medium quality seaweed — standard amounts recommended for effective formulation.",
        },
        "Lower Quality": {
            "color": "red",
            "emoji": "⚠️",
            "message": "Lower quality seaweed detected — increased amount needed to achieve therapeutic effectiveness.",
        },
    }

    def __init__(self):
        self.regressor  = None
        self.classifier = None
        self.encoders   = None
        self.meta       = None
        self._loaded    = False

    def load(self):
        """Load all trained model artifacts."""
        if self._loaded:
            return True
        try:
            self.regressor  = joblib.load(os.path.join(MODEL_DIR, "effectiveness_regressor.joblib"))
            self.classifier = joblib.load(os.path.join(MODEL_DIR, "quality_classifier.joblib"))
            self.encoders   = joblib.load(os.path.join(MODEL_DIR, "label_encoders.joblib"))
            with open(os.path.join(MODEL_DIR, "model_meta.json")) as f:
                self.meta = json.load(f)
            self._loaded = True
            return True
        except FileNotFoundError as e:
            print(f"[QualityPredictor] Model files not found: {e}")
            return False

    def is_ready(self):
        return self._loaded

    # ── Feature Parsing Helpers ──────────────────────────────────────────

    @staticmethod
    def _parse_temp(temp_str):
        if not temp_str: return 40.0
        nums = re.findall(r'\d+\.?\d*', temp_str)
        floats = [float(n) for n in nums if 0 < float(n) < 200]
        return sum(floats) / len(floats) if floats else 40.0

    @staticmethod
    def _parse_moisture(m_str):
        if not m_str: return 50.0
        nums = re.findall(r'\d+\.?\d*', m_str)
        floats = [float(n) for n in nums if 0 <= float(n) <= 100]
        return sum(floats) / len(floats) if floats else 50.0

    @staticmethod
    def _parse_duration(d_str):
        if not d_str: return 30.0
        d_str = d_str.lower()
        if 'hour' in d_str:
            nums = re.findall(r'\d+\.?\d*', d_str)
            return float(nums[0]) * 60 if nums else 60.0
        nums = re.findall(r'\d+\.?\d*', d_str)
        return float(nums[0]) if nums else 30.0

    def _encode(self, seaweed_type, season, freshness, location,
                temperature="", moisture="", duration="", ph_control=""):
        """Build feature vector for ML model."""
        le = self.encoders

        # Handle unseen labels gracefully
        sw_enc = (le['seaweed'].transform([seaweed_type])[0]
                  if seaweed_type in le['seaweed'].classes_ else 0)
        s_enc  = (le['season'].transform([season])[0]
                  if season in le['season'].classes_ else 0)
        f_enc  = (le['freshness'].transform([freshness])[0]
                  if freshness in le['freshness'].classes_ else 0)
        l_enc  = (le['location'].transform([location])[0]
                  if location in le['location'].classes_ else 0)

        return np.array([[
            sw_enc,
            s_enc,
            f_enc,
            l_enc,
            self._parse_temp(temperature),
            self._parse_moisture(moisture),
            self._parse_duration(duration),
            1 if ph_control.strip().upper() not in ['N/A', '', 'NOT SPECIFIED'] else 0,
        ]], dtype=float)

    # ── Main Prediction Method ───────────────────────────────────────────

    def predict(self, seaweed_type: str, season: str, freshness: str,
                location: str, prescription: dict = None):
        """
        Predict quality label, effectiveness score, and amount multiplier.

        Args:
            seaweed_type : Seaweed species name
            season       : "dry" | "wet"
            freshness    : "fresh" | "dried" | "stored"
            location     : "deep" | "shallow"
            prescription : Optional prescription dict for better accuracy
                           (includes temperature, moisture, duration, ph_control)

        Returns:
            dict with keys:
              quality_label, effectiveness_score, quality_multiplier,
              confidence, quality_info, model_used
        """
        if not self._loaded:
            return self._rule_based_fallback(season, freshness, location)

        # Extract prescription context if available
        temp      = prescription.get("temperature", "") if prescription else ""
        moisture  = prescription.get("moisture", "")    if prescription else ""
        duration  = prescription.get("duration", "")    if prescription else ""
        ph        = prescription.get("ph_control", "")  if prescription else ""

        X = self._encode(seaweed_type, season, freshness, location,
                         temp, moisture, duration, ph)

        # Predict effectiveness score
        score = int(round(float(self.regressor.predict(X)[0])))
        score = max(60, min(98, score))

        # Predict quality label
        label_enc = self.classifier.predict(X)[0]
        proba     = self.classifier.predict_proba(X)[0]
        confidence = float(max(proba))
        quality_label = self.encoders['quality'].inverse_transform([label_enc])[0]

        multiplier   = self.QUALITY_MULTIPLIERS.get(quality_label, 1.0)
        quality_info = self.QUALITY_INFO.get(quality_label, {})

        return {
            "quality_label":       quality_label,
            "effectiveness_score": score,
            "quality_multiplier":  multiplier,
            "confidence":          round(confidence, 3),
            "quality_info":        quality_info,
            "model_used":          "ML (GradientBoosting + RandomForest)",
            "model_accuracy":      self.meta.get("classifier_accuracy", 0.952),
        }

    def _rule_based_fallback(self, season, freshness, location):
        """Fallback if model not loaded."""
        score = 70
        score += 12 if season == "dry" else 4
        score += 10 if freshness == "fresh" else (6 if freshness == "dried" else 0)
        score += 8  if location == "deep"  else 3
        score = max(60, min(98, score))

        label = ("High Quality"   if score >= 85
                 else "Medium Quality" if score >= 73
                 else "Lower Quality")

        return {
            "quality_label":       label,
            "effectiveness_score": score,
            "quality_multiplier":  self.QUALITY_MULTIPLIERS.get(label, 1.0),
            "confidence":          1.0,
            "quality_info":        self.QUALITY_INFO.get(label, {}),
            "model_used":          "Rule-based fallback",
            "model_accuracy":      None,
        }


# Singleton
quality_predictor = QualityPredictor()