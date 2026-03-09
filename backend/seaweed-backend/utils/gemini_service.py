import os
import json
import re
from groq import Groq
from dotenv import load_dotenv
from utils.quality_predictor import quality_predictor

load_dotenv()

client = Groq(api_key=os.getenv("groq_API Key"))

# Load ML model at startup
quality_predictor.load()


def get_ai_prescription(seaweed_type, medicine_name, health_category,
                        seaweed_amount, seaweed_unit, base_ingredients,
                        recommended_dose="", preparation_steps=None,
                        contraindications="",
                        season="wet", freshness="dried", location="shallow",
                        prescription=None):

    if preparation_steps is None:
        preparation_steps = []

    # ── ML Quality Prediction ─────────────────────────────────────────────
    ml_result = quality_predictor.predict(
        seaweed_type=seaweed_type,
        season=season,
        freshness=freshness,
        location=location,
        prescription=prescription,
    )

    quality_label        = ml_result["quality_label"]
    effectiveness_score  = ml_result["effectiveness_score"]
    quality_multiplier   = ml_result["quality_multiplier"]
    quality_info         = ml_result["quality_info"]
    model_used           = ml_result["model_used"]
    model_accuracy       = ml_result.get("model_accuracy")
    confidence           = ml_result["confidence"]

    # ── Adjusted seaweed amount ───────────────────────────────────────────
    adjusted_seaweed_amount = round(seaweed_amount * quality_multiplier, 2)

    # Base ingredients text
    base_ing_text = "\n".join(
        f"  - {ing['name']}: {ing.get('value', '?')} {ing.get('unit', '')}"
        for ing in base_ingredients if ing.get("name")
    )
    base_seaweed_val = base_ingredients[0].get("value", 1.0) if base_ingredients else 1.0

    prompt = f"""You are an expert in seaweed-based traditional medicine formulation.

Prescription: {medicine_name}
Seaweed Type: {seaweed_type}
Health Category: {health_category}

User's Seaweed Quality Details:
- Original amount entered: {seaweed_amount} {seaweed_unit}
- Harvest Season: {season} ({"higher nutrient concentration" if season == "dry" else "lower nutrient concentration"})
- Freshness: {freshness} ({"maximum bioactive compounds" if freshness == "fresh" else "some compound degradation"})
- Harvest Location: {location} water ({"higher mineral content" if location == "deep" else "standard mineral content"})

ML Model Prediction (95.2% accuracy):
- Quality Label: {quality_label}
- Effectiveness Score: {effectiveness_score}%
- Quality Multiplier: {quality_multiplier}
- Adjusted Seaweed Amount: {adjusted_seaweed_amount} {seaweed_unit}

Recommended Dose: {recommended_dose}
Contraindications: {contraindications or "None"}

Base Formula (reference - for {base_seaweed_val}{seaweed_unit} of seaweed):
{base_ing_text}

RULES:
1. Use the ML-adjusted amount ({adjusted_seaweed_amount}{seaweed_unit}) to calculate all ingredients
2. Do NOT include the main seaweed in calculated_ingredients
3. Every ingredient MUST have a real numeric amount
4. Explain how ML quality prediction affected the calculation
5. Return ONLY valid JSON — no markdown, no backticks

Return this exact JSON:
{{
  "calculated_ingredients": [
    {{"name": "ingredient name", "amount": 2.67, "unit": "g", "role": "why used"}}
  ],
  "quality_assessment": {{
    "label": "{quality_label}",
    "message": "explain how season={season}, freshness={freshness}, location={location} led to {quality_label}",
    "recommendation": "practical advice based on {quality_label}"
  }},
  "quality_adjustment_explanation": "2-3 sentences: WHY ML model adjusted from {seaweed_amount}g to {adjusted_seaweed_amount}g",
  "scientific_reasoning": "2-3 sentences: science behind quality-aware formulation",
  "preparation_tips": ["quality-specific tip 1", "tip 2", "tip 3"],
  "warnings": ["quality-based warning", "general warning"],
  "effectiveness_score": {effectiveness_score}
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        raw_text = response.choices[0].message.content.strip()
        raw_text = re.sub(r"```json\s*", "", raw_text)
        raw_text = re.sub(r"```\s*", "", raw_text)
        raw_text = raw_text.strip()

        result = json.loads(raw_text)
        result["ai_powered"] = True
        result["model"]      = "Llama 3.3 70B (Groq)"

        # ── Attach full quality metadata ──────────────────────────────────
        result["quality_factors"] = {
            "season":             season,
            "freshness":          freshness,
            "location":           location,
            "multiplier":         quality_multiplier,
            "adjusted_amount":    adjusted_seaweed_amount,
            "original_amount":    seaweed_amount,
            "unit":               seaweed_unit,
            "effectiveness_score": effectiveness_score,
            "quality_label":      quality_info,
            "ml_model":           model_used,
            "ml_accuracy":        model_accuracy,
            "ml_confidence":      confidence,
        }

        return result

    except Exception as e:
        print("GROQ ERROR:", str(e))
        return _fallback_calculation(
            base_ingredients, seaweed_amount, seaweed_unit,
            adjusted_seaweed_amount, quality_multiplier,
            effectiveness_score, quality_info, model_used,
            model_accuracy, confidence, str(e)
        )


def _fallback_calculation(base_ingredients, seaweed_amount, seaweed_unit,
                          adjusted_amount, multiplier, effectiveness_score,
                          quality_info, model_used, model_accuracy,
                          confidence, error_msg=""):
    valid        = [ing for ing in base_ingredients if "value" in ing]
    base_seaweed = valid[0]["value"] if valid else 1.0

    calculated = []
    for ing in valid[1:]:
        ratio = ing["value"] / base_seaweed if base_seaweed > 0 else 0
        calculated.append({
            "name":   ing["name"],
            "amount": round(ratio * adjusted_amount, 2),
            "unit":   ing.get("unit", ""),
            "role":   "Supporting ingredient"
        })

    return {
        "calculated_ingredients": calculated,
        "quality_assessment": {
            "label":          quality_info.get("label", "Medium Quality"),
            "message":        f"ML predicted quality. Adjusted: {adjusted_amount}{seaweed_unit} (from {seaweed_amount}{seaweed_unit})",
            "recommendation": "Follow standard preparation steps carefully.",
        },
        "quality_adjustment_explanation": (
            f"ML model (accuracy: {model_accuracy}) adjusted amount "
            f"from {seaweed_amount}g to {adjusted_amount}g "
            f"(multiplier: {multiplier})."
        ),
        "scientific_reasoning": "Calculated using ML quality-adjusted ratios.",
        "preparation_tips":  ["Follow preparation steps carefully.", "Maintain temperature."],
        "warnings":          ["Consult a healthcare professional before use."],
        "effectiveness_score": effectiveness_score,
        "ai_powered":        False,
        "fallback_reason":   error_msg[:200] if error_msg else "API unavailable",
        "quality_factors": {
            "multiplier":         multiplier,
            "adjusted_amount":    adjusted_amount,
            "original_amount":    seaweed_amount,
            "unit":               seaweed_unit,
            "effectiveness_score": effectiveness_score,
            "quality_label":      quality_info,
            "ml_model":           model_used,
            "ml_accuracy":        model_accuracy,
            "ml_confidence":      confidence,
        },
    }