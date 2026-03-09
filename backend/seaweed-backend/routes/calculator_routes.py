from flask import Blueprint, jsonify, request
from utils.gemini_service import get_ai_prescription
import json, os

calculator_bp = Blueprint("calculator", __name__)

LOOKUP_PATH = os.path.join(os.path.dirname(__file__), "../ml/saved_models/prescription_lookup.json")

def load_lookup():
    if os.path.exists(LOOKUP_PATH):
        with open(LOOKUP_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}

@calculator_bp.route("/seaweeds", methods=["GET"])
def get_seaweeds():
    return jsonify([
        {
            "id": "gracilaria",
            "name": "Gracilaria Edulis",
            "description": "High in agar & minerals. Excellent for skin, hair, gut health.",
            "properties": ["Mineral-rich", "Agar source", "Antioxidant"],
        },
        {
            "id": "kappaphycus",
            "name": "Kappaphycus Alvarezii",
            "description": "Rich in carrageenan. Supports digestive, skin, and hydration health.",
            "properties": ["Anti-inflammatory", "Carrageenan-rich", "Hydrating"],
        },
    ])

@calculator_bp.route("/prescriptions", methods=["GET"])
def get_prescriptions():
    lookup = load_lookup()
    seaweed = request.args.get("seaweed", "").strip()
    category = request.args.get("category", "").strip()

    if not seaweed:
        return jsonify({"error": "seaweed parameter is required"}), 400

    all_for_seaweed = [v for v in lookup.values() if v["seaweed_type"] == seaweed]
    categories = sorted(set(v["health_category"] for v in all_for_seaweed))

    filtered = all_for_seaweed if not category else [
        v for v in all_for_seaweed if v["health_category"] == category
    ]

    slim = [{
        "name": p["name"],
        "health_category": p["health_category"],
        "health_category_raw": p["health_category_raw"],
        "recommended_dose": p["recommended_dose"],
        "temperature": p["temperature"],
        "duration": p["duration"],
        "ingredient_count": len([i for i in p["ingredients"] if i.get("name")]),
        "key": f"{p['seaweed_type']}||{p['name']}",
    } for p in filtered]

    return jsonify({
        "seaweed": seaweed,
        "categories": categories,
        "prescriptions": slim,
        "total": len(slim),
    })

@calculator_bp.route("/detail", methods=["GET"])
def get_detail():
    lookup = load_lookup()
    key = request.args.get("key", "")
    if not key:
        return jsonify({"error": "key is required"}), 400
    p = lookup.get(key)
    if not p:
        return jsonify({"error": "Prescription not found"}), 404
    return jsonify(p)

@calculator_bp.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    key = data.get("prescription_key", "")
    seaweed_amount = data.get("seaweed_amount")

    # ── NEW: Quality parameters ──────────────────────────────────────────
    season    = data.get("season", "wet")        # dry / wet
    freshness = data.get("freshness", "dried")   # fresh / dried / stored
    location  = data.get("location", "shallow")  # deep / shallow

    if not key:
        return jsonify({"error": "prescription_key is required"}), 400
    if seaweed_amount is None:
        return jsonify({"error": "seaweed_amount is required"}), 400

    try:
        seaweed_amount = float(seaweed_amount)
    except:
        return jsonify({"error": "seaweed_amount must be a number"}), 400

    if seaweed_amount <= 0:
        return jsonify({"error": "seaweed_amount must be greater than 0"}), 400

    # Validate quality parameters
    if season not in ["dry", "wet"]:
        return jsonify({"error": "season must be 'dry' or 'wet'"}), 400
    if freshness not in ["fresh", "dried", "stored"]:
        return jsonify({"error": "freshness must be 'fresh', 'dried', or 'stored'"}), 400
    if location not in ["deep", "shallow"]:
        return jsonify({"error": "location must be 'deep' or 'shallow'"}), 400

    lookup = load_lookup()
    prescription = lookup.get(key)
    if not prescription:
        return jsonify({"error": f"Prescription not found: {key}"}), 404

    seaweed_unit = "g"
    if prescription["ingredients"] and prescription["ingredients"][0].get("unit"):
        seaweed_unit = prescription["ingredients"][0]["unit"]

    ai_result = get_ai_prescription(
        seaweed_type=prescription["seaweed_type"],
        medicine_name=prescription["name"],
        health_category=prescription["health_category_raw"],
        seaweed_amount=seaweed_amount,
        seaweed_unit=seaweed_unit,
        base_ingredients=prescription["ingredients"],
        recommended_dose=prescription.get("recommended_dose", ""),
        preparation_steps=prescription.get("preparation_steps", []),
        contraindications=prescription.get("contraindications", ""),
        # ── Pass quality factors ──
        season=season,
        freshness=freshness,
        location=location,
    )

    return jsonify({
        "prescription": prescription,
        "seaweed_amount": seaweed_amount,
        "seaweed_unit": seaweed_unit,
        **ai_result,
    })