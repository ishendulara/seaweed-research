"""
Smart Seaweed Cultivation Assistant
AI Prescription Calculator - Backend
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
import os

load_dotenv()

# -------------------------
# CONFIG
# -------------------------

HARVEST_THRESHOLDS = {
    "kappaphycus": 1500,
    "gracilaria": 800
}

SPECIES_PARAMS = {
    "kappaphycus": {"K": 1800, "r": 0.12, "t0": 25},
    "gracilaria":  {"K": 1000, "r": 0.11, "t0": 26}
}

# -------------------------
# APP
# -------------------------

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

from routes.calculator_routes import calculator_bp
from routes.ml_routes import ml_bp

app.register_blueprint(calculator_bp, url_prefix="/api/calculator")
app.register_blueprint(ml_bp, url_prefix="/api/ml")

# -------------------------
# LOGISTIC FUNCTIONS
# -------------------------

def logistic(t, K, r, t0):
    return K / (1 + np.exp(-r * (t - t0)))

def inverse_logistic(weight, K, r, t0):
    weight = min(max(weight, 1), K - 1)
    return t0 - (1 / r) * np.log((K / weight) - 1)

# -------------------------
# INDEX ENDPOINT
# -------------------------

@app.route("/")
def index():
    return {"message": "Seaweed AI Prescription Calculator API", "status": "running"}

# -------------------------
# PREDICTION ENDPOINT
# -------------------------

@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json()

    species        = body.get("species")
    initial_weight = float(body.get("initial_weight"))
    start_day      = int(body.get("start_day"))

    if species not in SPECIES_PARAMS:
        return jsonify({"error": "Unknown species"}), 400

    K  = SPECIES_PARAMS[species]["K"]
    r  = SPECIES_PARAMS[species]["r"]
    t0 = SPECIES_PARAMS[species]["t0"]

    biological_day  = inverse_logistic(initial_weight, K, r, t0)
    prediction_days = 43
    predictions     = []

    for i in range(prediction_days):
        day          = start_day + i
        biological_t = biological_day + i
        weight       = logistic(biological_t, K, r, t0)
        predictions.append({"day": day, "weight_g": round(weight, 2)})

    threshold   = HARVEST_THRESHOLDS[species]
    harvest_day = None

    for p in predictions:
        if p["weight_g"] >= threshold:
            harvest_day    = p["day"]
            harvest_weight = p["weight_g"]
            break

    if harvest_day is None:
        harvest_weight = predictions[-1]["weight_g"]

    return jsonify({
        "species":               species,
        "daily_predictions":     predictions,
        "predicted_harvest_day": harvest_day,
        "harvest_weight":        round(harvest_weight, 2)
    })

# -------------------------
# IOT WEIGHT ENDPOINTS
# -------------------------

latest_weight = {"weight": None}

@app.route("/iot-weight", methods=["POST"])
def receive_weight():
    body = request.get_json()
    latest_weight["weight"] = body.get("weight")
    return jsonify({"status": "ok", "weight": latest_weight["weight"]})

@app.route("/iot-weight", methods=["GET"])
def get_weight():
    return jsonify(latest_weight)

# -------------------------
# RUN
# -------------------------

if __name__ == "__main__":
    app.run(debug=True, port=8000)