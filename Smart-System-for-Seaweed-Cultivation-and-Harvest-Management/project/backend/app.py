from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
import io

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

app = FastAPI(title="Seaweed AI Backend", version="2.0")

# CORS — allow the dashboard and Postman to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# =======================
# PATHS & CONSTANTS
# =======================
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR.parent / "models"

# --- Model 1: Seaweed Type Identification ---
TYPE_MODEL_PATH = MODELS_DIR / "final_model.keras"
TYPE_CLASS_NAMES = ["gracilaria", "kappaphycus", "non_seaweed"]
TYPE_THRESHOLDS = {
    "gracilaria": 0.70,
    "kappaphycus": 0.70,
    "non_seaweed": 0.50,
}

# --- Model 2: Health Classification ---
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

# =======================
# LAZY MODEL LOADING
# =======================
_models = {}  # cache: "type" -> keras model, "health" -> keras model
_tf = None
_np = None


def _ensure_deps():
    """Import heavy dependencies once."""
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

    try:
        return keras.models.load_model(str(path), compile=False)
    except (TypeError, ValueError):
        pass

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


def _get_model(name: str):
    """Return a loaded Keras model by name, loading on first call."""
    if name in _models:
        return _models[name]

    _ensure_deps()

    path = TYPE_MODEL_PATH if name == "type" else HEALTH_MODEL_PATH
    print(f"🔄 Loading {name} model from {path} ...")
    _models[name] = _load_model_compat(path)
    print(f"✅ {name} model loaded!")
    return _models[name]


def _preprocess(image_bytes: bytes):
    """Read image bytes → preprocessed numpy array ready for prediction."""
    from PIL import Image as PILImage

    _ensure_deps()
    img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = _np.array(img, dtype=_np.float32)
    arr = _np.expand_dims(arr, axis=0)
    arr = _tf.keras.applications.efficientnet_v2.preprocess_input(arr)
    return arr


# =======================
# HOME PAGE
# =======================
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# =======================
# ENDPOINT 1 — Seaweed Type Identification
# POST /predict/type
# =======================
@app.post("/predict/type")
async def predict_type(file: UploadFile = File(...)):
    """Identify the seaweed type (gracilaria / kappaphycus / non_seaweed)."""
    try:
        image_bytes = await file.read()
        arr = _preprocess(image_bytes)
        keras_model = _get_model("type")

        probs = keras_model.predict(arr, verbose=0)[0]
        idx = int(_np.argmax(probs))
        confidence = float(probs[idx])
        predicted_class = TYPE_CLASS_NAMES[idx]
        threshold = TYPE_THRESHOLDS.get(predicted_class, 0.70)

        all_probs = {c: round(float(p), 4) for c, p in zip(TYPE_CLASS_NAMES, probs)}

        if confidence < threshold:
            return JSONResponse(content={
                "model": "seaweed_type",
                "label": "Unknown",
                "confidence": round(confidence, 4),
                "rejected": True,
                "reason": f"Confidence {confidence:.2%} below threshold {threshold:.2%}",
                "probabilities": all_probs,
            })

        return JSONResponse(content={
            "model": "seaweed_type",
            "label": predicted_class,
            "confidence": round(confidence, 4),
            "rejected": False,
            "probabilities": all_probs,
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# =======================
# ENDPOINT 2 — Health Classification
# POST /predict/health
# =======================
@app.post("/predict/health")
async def predict_health(file: UploadFile = File(...)):
    """Classify seaweed health (healthy/unhealthy × gracilaria/kappaphycus)."""
    try:
        image_bytes = await file.read()
        arr = _preprocess(image_bytes)
        keras_model = _get_model("health")

        probs = keras_model.predict(arr, verbose=0)[0]
        idx = int(_np.argmax(probs))
        confidence = float(probs[idx])
        predicted_class = HEALTH_CLASS_NAMES[idx]

        # Derive health status and species from class name
        is_healthy = predicted_class.startswith("healthy")
        species = predicted_class.replace("healthy_", "").replace("unhealthy_", "")

        all_probs = {c: round(float(p), 4) for c, p in zip(HEALTH_CLASS_NAMES, probs)}

        if confidence < HEALTH_THRESHOLD:
            return JSONResponse(content={
                "model": "seaweed_health",
                "label": "Unknown",
                "confidence": round(confidence, 4),
                "rejected": True,
                "reason": f"Confidence {confidence:.2%} below threshold {HEALTH_THRESHOLD:.2%}",
                "probabilities": all_probs,
            })

        return JSONResponse(content={
            "model": "seaweed_health",
            "label": predicted_class,
            "health_status": "healthy" if is_healthy else "unhealthy",
            "species": species,
            "confidence": round(confidence, 4),
            "rejected": False,
            "probabilities": all_probs,
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# =======================
# ENDPOINT 3 — Full Analysis (both models)
# POST /predict/full
# =======================
@app.post("/predict/full")
async def predict_full(file: UploadFile = File(...)):
    """Run BOTH models on one image and return combined results."""
    try:
        image_bytes = await file.read()
        arr = _preprocess(image_bytes)

        # --- Type prediction ---
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

        # --- Health prediction ---
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

        return JSONResponse(content={
            "type_result": type_result,
            "health_result": health_result,
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# =======================
# BACKWARD COMPAT — old /predict still works
# =======================
@app.post("/predict")
async def predict_legacy(file: UploadFile = File(...)):
    """Legacy endpoint — same as /predict/type."""
    return await predict_type(file)