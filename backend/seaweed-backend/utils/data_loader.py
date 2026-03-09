"""
Utility: Load seaweed_prescriptions.csv → clean → return list of prescription dicts.
Also provides a seed_database() function to import data into MongoDB.
"""

import csv
import io
import os
import re

CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/seaweed_prescriptions.csv")


def parse_quantity(qty_str: str):
    """
    Parse a quantity string like '15 g', '200 ml', '5 ml' into
    { value: float, unit: str }.
    Returns None if empty or unparseable.
    """
    if not qty_str or not qty_str.strip():
        return None
    qty_str = qty_str.strip()
    # Match number (int or float) followed by optional unit
    match = re.match(r"([\d.]+)\s*([a-zA-Z%]*)", qty_str)
    if match:
        value = float(match.group(1))
        unit = match.group(2).strip() if match.group(2) else ""
        return {"value": value, "unit": unit}
    return None


def parse_temperature(temp_str: str):
    """
    Normalize temperature strings:
      '9095°C' -> '90–95°C'
      'Ambient' -> 'Ambient (Room Temp)'
      '25°C' -> '25°C'
    """
    if not temp_str or not temp_str.strip():
        return "Not specified"
    t = temp_str.strip()
    # Fix merged number ranges like '9095°C' -> '90-95°C'
    t = re.sub(r"(\d{2})(\d{2})°C", r"\1–\2°C", t)
    t = re.sub(r"(\d{2})(\d{2})°C", r"\1–\2°C", t)
    if "ambient" in t.lower():
        return "Ambient (Room Temp ~25°C)"
    return t


def parse_preparation_steps(steps_str: str):
    """
    Split numbered preparation steps string into a list.
    Handles both '\n' separated and period-numbered formats.
    """
    if not steps_str or not steps_str.strip():
        return []
    # Split on newline + optional number+dot
    steps = re.split(r"\n\d+\.\s*", steps_str.strip())
    # Remove first empty element if splitting left one
    steps = [s.strip() for s in steps if s.strip()]
    # Remove leading "1. " if present in first element
    if steps and re.match(r"^\d+\.\s+", steps[0]):
        steps[0] = re.sub(r"^\d+\.\s+", "", steps[0])
    return steps


def parse_quality_control(qc_str: str):
    """Split bullet-style QC items into a list."""
    if not qc_str or not qc_str.strip():
        return []
    items = re.split(r"\n\s*", qc_str.strip())
    return [i.strip().lstrip("•-* ") for i in items if i.strip()]


def parse_critical_points(cp_str: str):
    """Split critical control points into a list."""
    if not cp_str or not cp_str.strip():
        return []
    items = re.split(r"\n\s*", cp_str.strip())
    return [i.strip().lstrip("•-* ") for i in items if i.strip()]


def normalize_health_category(cat: str):
    """
    Map the many fine-grained health categories from the CSV into
    broader groups used by the frontend selector, while keeping the
    original value too.
    """
    cat = cat.strip()
    cat_lower = cat.lower()
    if any(k in cat_lower for k in ["digest", "constipation", "indigestion", "gut", "fiber", "prebiotic", "stomach"]):
        return "Digestive Health"
    if any(k in cat_lower for k in ["immune", "antioxidant", "detox", "cold"]):
        return "Immune & Antioxidant Support"
    if any(k in cat_lower for k in ["skin", "facial", "face", "exfoliat", "glow", "hydrat"]):
        return "Skin Health"
    if any(k in cat_lower for k in ["hair", "scalp"]):
        return "Hair & Scalp Health"
    if any(k in cat_lower for k in ["joint", "swelling", "inflammation", "pain"]):
        return "Joint & Anti-inflammatory"
    if any(k in cat_lower for k in ["energy", "mineral", "electrolyte", "rehydrat", "dehydrat", "fatigue", "calcium", "iron"]):
        return "Energy & Mineral Supplementation"
    if any(k in cat_lower for k in ["relax", "calm", "sleep"]):
        return "Relaxation Support"
    if any(k in cat_lower for k in ["oral", "teeth", "dental"]):
        return "Oral Health"
    if any(k in cat_lower for k in ["plant", "soil", "fertiliz"]):
        return "Agricultural / Fertilizer"
    return "General Health"


def load_prescriptions():
    """
    Read CSV → parse → return clean list of prescription dicts.
    """
    with open(CSV_PATH, "rb") as f:
        raw = f.read()
    text = raw.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))

    prescriptions = []
    for idx, row in enumerate(reader):
        seaweed = row.get("Seaweed Type", "").strip()
        if not seaweed:
            continue  # skip empty rows

        # Build ingredients list (up to 5 pairs)
        ingredients = []
        for i in range(1, 6):
            name = row.get(f"Ingredient{i}", "").strip()
            qty_raw = row.get(f"Ingredient{i}_qty", "").strip()
            if not name:
                continue
            qty = parse_quantity(qty_raw)
            ing = {"name": name, "quantity_raw": qty_raw}
            if qty:
                ing["value"] = qty["value"]
                ing["unit"] = qty["unit"]
            ingredients.append(ing)

        raw_category = row.get("Health Category", "").strip()
        broad_category = normalize_health_category(raw_category)

        prescription = {
            "seaweed_type": seaweed,
            "name": row.get("Name of Medicine", "").strip(),
            "health_category_raw": raw_category,
            "health_category": broad_category,
            "ingredients": ingredients,
            "preparation_steps": parse_preparation_steps(row.get("Preparation Steps", "")),
            "temperature": parse_temperature(row.get("Temperature", "")),
            "duration": row.get("Duration", "").strip() or "Not specified",
            "mixing_method": row.get("Mixing Method", "").strip() or "Not specified",
            "ph_control": row.get("pH Control", "").strip() or "Not specified",
            "moisture": row.get("Moisture", "").strip() or "Not specified",
            "critical_control_points": parse_critical_points(row.get("Critical Control Points", "")),
            "quality_control": parse_quality_control(row.get("Quality Control", "")),
            "contraindications": row.get("Contraindications/ Notes", "").strip(),
            "recommended_dose": row.get("Recommended Dose", "").strip(),
        }
        prescriptions.append(prescription)

    return prescriptions


def seed_database(mongo):
    """
    Seed MongoDB with prescription data from CSV.
    Clears existing data and re-imports.
    """
    collection = mongo.db.prescriptions
    collection.drop()
    data = load_prescriptions()
    if data:
        collection.insert_many(data)
    print(f"[Seed] Inserted {len(data)} prescriptions into MongoDB.")
    return len(data)


if __name__ == "__main__":
    # Quick test
    data = load_prescriptions()
    print(f"Loaded {len(data)} prescriptions")
    for p in data[:2]:
        print(p["name"], "|", p["health_category"])
        for ing in p["ingredients"]:
            print("  ->", ing)