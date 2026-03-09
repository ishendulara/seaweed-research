import os
import shutil
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "models", "health_best_model.keras")
UNLABELED_DIR = os.path.join(BASE_DIR, "dataset", "unlabeled")
PSEUDO_DIR = os.path.join(BASE_DIR, "dataset", "pseudo_labeled")

IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.70

# Exact class order from train_health_model.py
CLASS_NAMES = [
    "healthy_gracilaria",
    "healthy_kappaphycus",
    "unhealthy_gracilaria",
    "unhealthy_kappaphycus",
]

# Restrict predictions by species folder
SPECIES_CLASS_MAP = {
    "Gracilaria": ["healthy_gracilaria", "unhealthy_gracilaria"],
    "Kappaphychus": ["healthy_kappaphycus", "unhealthy_kappaphycus"],
}

VALID_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def ensure_output_dirs():
    os.makedirs(PSEUDO_DIR, exist_ok=True)
    for class_name in CLASS_NAMES:
        os.makedirs(os.path.join(PSEUDO_DIR, class_name), exist_ok=True)


def load_and_preprocess_image(img_path):
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img)
    img_array = tf.keras.applications.efficientnet_v2.preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def get_unique_destination(dst_dir, file_name):
    dst_path = os.path.join(dst_dir, file_name)

    if not os.path.exists(dst_path):
        return dst_path

    name, ext = os.path.splitext(file_name)
    counter = 1
    while True:
        new_name = f"{name}_pseudo_{counter}{ext}"
        new_path = os.path.join(dst_dir, new_name)
        if not os.path.exists(new_path):
            return new_path
        counter += 1


def predict_for_species_folder(model, species_folder_name):
    folder_path = os.path.join(UNLABELED_DIR, species_folder_name)

    if not os.path.isdir(folder_path):
        print(f"[SKIP] Missing folder: {folder_path}")
        return

    valid_classes = SPECIES_CLASS_MAP[species_folder_name]
    valid_indices = [CLASS_NAMES.index(cls) for cls in valid_classes]

    print("\n" + "=" * 50)
    print(f"Processing species folder: {species_folder_name}")
    print(f"Allowed classes: {valid_classes}")
    print("=" * 50)

    total_images = 0
    copied_images = 0
    skipped_low_conf = 0
    error_count = 0

    for file_name in os.listdir(folder_path):
        img_path = os.path.join(folder_path, file_name)

        if not os.path.isfile(img_path):
            continue

        if not file_name.lower().endswith(VALID_EXTENSIONS):
            continue

        total_images += 1

        try:
            input_image = load_and_preprocess_image(img_path)
            predictions = model.predict(input_image, verbose=0)[0]

            # Restrict predictions to species-compatible classes only
            restricted_probs = predictions[valid_indices]
            best_local_idx = int(np.argmax(restricted_probs))
            confidence = float(restricted_probs[best_local_idx])
            predicted_class = valid_classes[best_local_idx]

            if confidence >= CONFIDENCE_THRESHOLD:
                dst_dir = os.path.join(PSEUDO_DIR, predicted_class)
                dst_path = get_unique_destination(dst_dir, file_name)
                shutil.copy2(img_path, dst_path)
                copied_images += 1
                print(f"[COPIED]  {file_name} -> {predicted_class} ({confidence:.4f})")
            else:
                skipped_low_conf += 1
                print(f"[SKIPPED] {file_name} -> low confidence ({confidence:.4f})")

        except Exception as e:
            error_count += 1
            print(f"[ERROR]   {file_name}: {e}")

    print("\nSummary for", species_folder_name)
    print(f"Total images:      {total_images}")
    print(f"Copied images:     {copied_images}")
    print(f"Low-confidence:    {skipped_low_conf}")
    print(f"Errors:            {error_count}")


def main():
    print("Loading health model...")
    model = tf.keras.models.load_model(MODEL_PATH)

    ensure_output_dirs()

    for species_folder in SPECIES_CLASS_MAP.keys():
        predict_for_species_folder(model, species_folder)

    print("\nPseudo-labeling complete.")
    print(f"Pseudo-labeled images saved under: {PSEUDO_DIR}")


if __name__ == "__main__":
    main()