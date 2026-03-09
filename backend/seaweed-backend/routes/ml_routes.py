"""
ML Routes
=========
Endpoints for training status and model information.
"""

from flask import Blueprint, jsonify
from ml.predictor import predictor
import os, json

ml_bp = Blueprint("ml", __name__)

SAVE_DIR = os.path.join(os.path.dirname(__file__), "../ml/saved_models")


@ml_bp.route("/status", methods=["GET"])
def status():
    """Check if the ML model is trained and ready."""
    meta_path = os.path.join(SAVE_DIR, "model_meta.json")
    model_exists = os.path.exists(os.path.join(SAVE_DIR, "ingredient_predictor.joblib"))

    if model_exists and os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        return jsonify({
            "status": "ready",
            "model": "Multi-output Ridge Regression + Random Forest Classifier",
            "training_samples": meta.get("n_training_samples"),
            "seaweed_types": meta.get("seaweed_types"),
            "health_categories": meta.get("health_categories"),
            "has_quality_classifier": meta.get("has_quality_classifier"),
        })
    else:
        return jsonify({
            "status": "not_trained",
            "message": "Run: python ml/train_model.py to train the model."
        }), 200


@ml_bp.route("/categories", methods=["GET"])
def categories():
    """Return all broad health categories from the model."""
    if not predictor.is_ready():
        predictor.load()
    if not predictor.is_ready():
        return jsonify({"error": "Model not loaded"}), 503
    return jsonify(predictor.meta.get("health_categories", []))