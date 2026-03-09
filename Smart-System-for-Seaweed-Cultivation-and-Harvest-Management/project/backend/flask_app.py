"""
Seaweed Species Identification & Health Classification — Flask API
==================================================================
Two ML models served via Flask (matches the team's architecture).
  • Model 1: Seaweed Type   → gracilaria / kappaphycus / non_seaweed
  • Model 2: Seaweed Health → healthy or unhealthy (per species)

Run:
    cd project/backend
    python flask_app.py          # starts on http://127.0.0.1:5002
"""

import os
import io
from pathlib import Path

# Suppress TensorFlow warnings before any TF import
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"

from flask import Flask, request, jsonify
from flask_cors import CORS

# ──────────────────────────────────────────────
# Flask App
# ──────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # allow cross-origin requests from React dashboard

# ──────────────────────────────────────────────
# Paths & Constants
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR.parent / "models"

# Model 1 — Seaweed Type Identification
TYPE_MODEL_PATH = MODELS_DIR / "final_model.keras"
TYPE_CLASS_NAMES = ["gracilaria", "kappaphycus", "non_seaweed"]
TYPE_THRESHOLDS = {
    "gracilaria": 0.70,
    "kappaphycus": 0.70,
    "non_seaweed": 0.50,
}

# Model 2 — Health Classification
HEALTH_MODEL_PATH = MODELS_DIR / "health_final_model.keras"
HEALTH_CLASS_NAMES = [
    "healthy_gracilaria",
    "healthy_kappaphycus",
    "unhealthy_gracilaria",
    "unhealthy_kappaphycus",
]
HEALTH_THRESHOLD = 0.50

IMG_SIZE = (224, 224)

print(f"📂 Type model   : {TYPE_MODEL_PATH}")
print(f"📂 Health model  : {HEALTH_MODEL_PATH}")

# ──────────────────────────────────────────────
# Lazy Model Loading (load on first request)
# ──────────────────────────────────────────────
_models = {}
_tf = None
_np = None


def _ensure_deps():
    global _tf, _np
    if _tf is None:
        import tensorflow as tf
        import numpy as np
        _tf = tf
        _np = np


def _load_model_compat(path):
    """Load a .keras model, stripping fields unsupported by older Keras."""
    import keras
    import json
    import zipfile
    import tempfile
    import shutil

    # Try direct load first
    try:
        return keras.models.load_model(str(path), compile=False)
    except (TypeError, ValueError):
        pass

    # Patch: open the .keras zip, strip quantization_config from config.json
    print(f"   ⚙️  Patching model config for Keras {keras.__version__} compat...")
    tmpdir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(str(path), "r") as zf:
            zf.extractall(tmpdir)

        cfg_path = os.path.join(tmpdir, "config.json")
        with open(cfg_path, "r") as f:
            cfg = json.load(f)

        def _strip_keys(obj):
            if isinstance(obj, dict):
                obj.pop("quantization_config", None)
                for v in obj.values():
                    _strip_keys(v)
            elif isinstance(obj, list):
                for v in obj:
                    _strip_keys(v)

        _strip_keys(cfg)

        with open(cfg_path, "w") as f:
            json.dump(cfg, f)

        patched = os.path.join(tmpdir, "patched.keras")
        with zipfile.ZipFile(patched, "w", zipfile.ZIP_DEFLATED) as zout:
            for root, _, files in os.walk(tmpdir):
                for fn in files:
                    if fn == "patched.keras":
                        continue
                    full = os.path.join(root, fn)
                    arcname = os.path.relpath(full, tmpdir)
                    zout.write(full, arcname)

        return keras.models.load_model(patched, compile=False)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def _get_model(name):
    if name in _models:
        return _models[name]
    _ensure_deps()
    path = TYPE_MODEL_PATH if name == "type" else HEALTH_MODEL_PATH
    print(f"🔄 Loading {name} model from {path} ...")
    _models[name] = _load_model_compat(path)
    print(f"✅ {name} model loaded!")
    return _models[name]

def _preprocess(image_bytes):
    from PIL import Image as PILImage
    _ensure_deps()
    img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = _np.array(img, dtype=_np.float32)
    arr = _np.expand_dims(arr, axis=0)
    arr = _tf.keras.applications.efficientnet_v2.preprocess_input(arr)
    return arr


# ──────────────────────────────────────────────
# Health-check
# ──────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Seaweed Species & Health API",
        "status": "running",
        "endpoints": [
            "POST /predict/type",
            "POST /predict/health",
            "POST /predict/full",
        ],
    })


# ──────────────────────────────────────────────
# ENDPOINT 1 — Seaweed Type Identification
# POST /predict/type
# ──────────────────────────────────────────────
@app.route("/predict/type", methods=["POST"])
def predict_type():
    """Identify: gracilaria / kappaphycus / non_seaweed"""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send as form-data with key 'file'."}), 400

    try:
        image_bytes = request.files["file"].read()
        arr = _preprocess(image_bytes)
        model = _get_model("type")

        probs = model.predict(arr, verbose=0)[0]
        idx = int(_np.argmax(probs))
        confidence = float(probs[idx])
        predicted_class = TYPE_CLASS_NAMES[idx]
        threshold = TYPE_THRESHOLDS.get(predicted_class, 0.70)

        all_probs = {c: round(float(p), 4) for c, p in zip(TYPE_CLASS_NAMES, probs)}

        if confidence < threshold:
            return jsonify({
                "model": "seaweed_type",
                "label": "Unknown",
                "confidence": round(confidence, 4),
                "rejected": True,
                "reason": f"Confidence {confidence:.2%} below threshold {threshold:.2%}",
                "probabilities": all_probs,
            })

        return jsonify({
            "model": "seaweed_type",
            "label": predicted_class,
            "confidence": round(confidence, 4),
            "rejected": False,
            "probabilities": all_probs,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────
# ENDPOINT 2 — Health Classification
# POST /predict/health
# ──────────────────────────────────────────────
@app.route("/predict/health", methods=["POST"])
def predict_health():
    """Classify: healthy/unhealthy × gracilaria/kappaphycus"""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send as form-data with key 'file'."}), 400

    try:
        image_bytes = request.files["file"].read()
        arr = _preprocess(image_bytes)
        model = _get_model("health")

        probs = model.predict(arr, verbose=0)[0]
        idx = int(_np.argmax(probs))
        confidence = float(probs[idx])
        predicted_class = HEALTH_CLASS_NAMES[idx]

        is_healthy = predicted_class.startswith("healthy")
        species = predicted_class.replace("healthy_", "").replace("unhealthy_", "")

        all_probs = {c: round(float(p), 4) for c, p in zip(HEALTH_CLASS_NAMES, probs)}

        if confidence < HEALTH_THRESHOLD:
            return jsonify({
                "model": "seaweed_health",
                "label": "Unknown",
                "confidence": round(confidence, 4),
                "rejected": True,
                "reason": f"Confidence {confidence:.2%} below threshold {HEALTH_THRESHOLD:.2%}",
                "probabilities": all_probs,
            })

        return jsonify({
            "model": "seaweed_health",
            "label": predicted_class,
            "health_status": "healthy" if is_healthy else "unhealthy",
            "species": species,
            "confidence": round(confidence, 4),
            "rejected": False,
            "probabilities": all_probs,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────
# ENDPOINT 3 — Full Analysis (both models)
# POST /predict/full
# ──────────────────────────────────────────────
@app.route("/predict/full", methods=["POST"])
def predict_full():
    """Run BOTH models on one image."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send as form-data with key 'file'."}), 400

    try:
        image_bytes = request.files["file"].read()
        arr = _preprocess(image_bytes)

        # --- Type ---
        type_model = _get_model("type")
        type_probs = type_model.predict(arr, verbose=0)[0]
        type_idx = int(_np.argmax(type_probs))
        type_conf = float(type_probs[type_idx])
        type_class = TYPE_CLASS_NAMES[type_idx]
        type_threshold = TYPE_THRESHOLDS.get(type_class, 0.70)

        type_result = {
            "label": type_class if type_conf >= type_threshold else "Unknown",
            "confidence": round(type_conf, 4),
            "rejected": type_conf < type_threshold,
            "probabilities": {c: round(float(p), 4) for c, p in zip(TYPE_CLASS_NAMES, type_probs)},
        }

        # --- Health ---
        health_model = _get_model("health")
        health_probs = health_model.predict(arr, verbose=0)[0]
        health_idx = int(_np.argmax(health_probs))
        health_conf = float(health_probs[health_idx])
        health_class = HEALTH_CLASS_NAMES[health_idx]
        is_healthy = health_class.startswith("healthy")
        species = health_class.replace("healthy_", "").replace("unhealthy_", "")

        health_result = {
            "label": health_class if health_conf >= HEALTH_THRESHOLD else "Unknown",
            "health_status": "healthy" if is_healthy else "unhealthy",
            "species": species,
            "confidence": round(health_conf, 4),
            "rejected": health_conf < HEALTH_THRESHOLD,
            "probabilities": {c: round(float(p), 4) for c, p in zip(HEALTH_CLASS_NAMES, health_probs)},
        }

        return jsonify({
            "type_result": type_result,
            "health_result": health_result,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
