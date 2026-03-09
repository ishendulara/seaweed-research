import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

# -----------------------------
# TensorFlow threading
# -----------------------------
tf.config.threading.set_inter_op_parallelism_threads(2)
tf.config.threading.set_intra_op_parallelism_threads(2)

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LABELED_DIR = os.path.join(BASE_DIR, "dataset", "labeled")
PSEUDO_DIR = os.path.join(BASE_DIR, "dataset", "pseudo_labeled")
MODELS_DIR = os.path.join(BASE_DIR, "models")

IMG_SIZE = (224, 224)
BATCH = 16
AUTOTUNE = tf.data.AUTOTUNE

# Exact class order from train_health_model.py
CLASS_NAMES = [
    "healthy_gracilaria",
    "healthy_kappaphycus",
    "unhealthy_gracilaria",
    "unhealthy_kappaphycus",
]

VALID_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


def get_file_paths_and_labels(root_dir):
    file_paths = []
    labels = []

    for class_index, class_name in enumerate(CLASS_NAMES):
        class_dir = os.path.join(root_dir, class_name)

        if not os.path.isdir(class_dir):
            continue

        for file_name in os.listdir(class_dir):
            file_path = os.path.join(class_dir, file_name)

            if os.path.isfile(file_path) and file_name.lower().endswith(VALID_EXTENSIONS):
                file_paths.append(file_path)
                labels.append(class_index)

    return file_paths, labels


def load_image(path, label):
    img = tf.io.read_file(path)
    img = tf.image.decode_image(img, channels=3, expand_animations=False)
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32)
    img = tf.keras.applications.efficientnet_v2.preprocess_input(img)
    return img, label


def build_dataset(file_paths, labels, training=False):
    ds = tf.data.Dataset.from_tensor_slices((file_paths, labels))
    ds = ds.map(load_image, num_parallel_calls=AUTOTUNE)

    if training:
        data_augmentation = keras.Sequential([
            layers.RandomFlip("horizontal_and_vertical"),
            layers.RandomRotation(0.3),
            layers.RandomZoom(0.2),
            layers.RandomContrast(0.2),
            layers.RandomTranslation(0.1, 0.1),
        ])

        def augment(img, label):
            return data_augmentation(img, training=True), label

        ds = ds.shuffle(max(len(file_paths), 1), reshuffle_each_iteration=True)
        ds = ds.map(augment, num_parallel_calls=AUTOTUNE)

    ds = ds.batch(BATCH).prefetch(AUTOTUNE)
    return ds


def build_model(num_classes):
    base = keras.applications.EfficientNetV2B0(
        include_top=False,
        input_shape=(224, 224, 3),
        weights="imagenet"
    )
    base.trainable = False

    inputs = keras.Input(shape=(224, 224, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax", dtype="float32")(x)

    model = keras.Model(inputs, outputs)
    return model, base


def save_confusion_matrix(cm, save_path):
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=CLASS_NAMES,
        yticklabels=CLASS_NAMES
    )
    plt.title("Semi-Supervised Confusion Matrix", fontsize=14, fontweight="bold")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()


def save_training_history(history1, history2, save_path):
    train_acc = history1.history["accuracy"] + history2.history["accuracy"]
    val_acc = history1.history["val_accuracy"] + history2.history["val_accuracy"]
    train_loss = history1.history["loss"] + history2.history["loss"]
    val_loss = history1.history["val_loss"] + history2.history["val_loss"]

    phase1_epochs = len(history1.history["accuracy"])
    epochs = range(1, len(train_acc) + 1)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    ax1.plot(epochs, train_acc, label="Training Accuracy", linewidth=2)
    ax1.plot(epochs, val_acc, label="Validation Accuracy", linewidth=2)
    ax1.axvline(x=phase1_epochs, color="green", linestyle="--", label="Fine-tuning starts", alpha=0.7)
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy")
    ax1.set_title("Semi-Supervised Accuracy")
    ax1.legend(loc="lower right")
    ax1.grid(True, alpha=0.3)

    ax2.plot(epochs, train_loss, label="Training Loss", linewidth=2)
    ax2.plot(epochs, val_loss, label="Validation Loss", linewidth=2)
    ax2.axvline(x=phase1_epochs, color="green", linestyle="--", label="Fine-tuning starts", alpha=0.7)
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.set_title("Semi-Supervised Loss")
    ax2.legend(loc="upper right")
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.close()


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    labeled_train_paths, labeled_train_labels = get_file_paths_and_labels(
        os.path.join(LABELED_DIR, "train")
    )
    pseudo_paths, pseudo_labels = get_file_paths_and_labels(PSEUDO_DIR)
    val_paths, val_labels = get_file_paths_and_labels(
        os.path.join(LABELED_DIR, "val")
    )
    test_paths, test_labels = get_file_paths_and_labels(
        os.path.join(LABELED_DIR, "test")
    )

    train_paths = labeled_train_paths + pseudo_paths
    train_labels = labeled_train_labels + pseudo_labels

    print("\n" + "=" * 50)
    print("DATA SUMMARY")
    print("=" * 50)
    print(f"Labeled train images: {len(labeled_train_paths)}")
    print(f"Pseudo-labeled images: {len(pseudo_paths)}")
    print(f"Total train images: {len(train_paths)}")
    print(f"Validation images: {len(val_paths)}")
    print(f"Test images: {len(test_paths)}")

    if len(train_paths) == 0:
        raise ValueError("No training images found. Check labeled and pseudo_labeled folders.")

    train_ds = build_dataset(train_paths, train_labels, training=True)
    val_ds = build_dataset(val_paths, val_labels, training=False)
    test_ds = build_dataset(test_paths, test_labels, training=False)

    classes = np.unique(train_labels)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=train_labels)
    class_weight = {int(c): float(w) for c, w in zip(classes, weights)}
    print("class_weight:", class_weight)

    model, base = build_model(len(CLASS_NAMES))

    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    callbacks = [
        keras.callbacks.EarlyStopping(
            patience=7,
            restore_best_weights=True,
            monitor="val_accuracy"
        ),
        keras.callbacks.ModelCheckpoint(
            os.path.join(MODELS_DIR, "semi_supervised_best_model.keras"),
            save_best_only=True,
            monitor="val_accuracy",
            mode="max"
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]

    print("\n" + "=" * 50)
    print("PHASE 1: Transfer Learning with Labeled + Pseudo-Labeled Data")
    print("=" * 50)

    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=30,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1
    )

    print("\n" + "=" * 50)
    print("PHASE 2: Fine-tuning")
    print("=" * 50)

    base.trainable = True
    fine_tune_at = int(len(base.layers) * 0.8)
    for layer in base.layers[:fine_tune_at]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    history2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=20,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1
    )

    print("\n" + "=" * 50)
    print("FINAL EVALUATION")
    print("=" * 50)

    test_loss, test_acc = model.evaluate(test_ds, verbose=1)
    print(f"Test Loss: {test_loss:.4f}")
    print(f"Test Accuracy: {test_acc:.4f} ({test_acc * 100:.2f}%)")

    y_true = []
    y_pred = []

    for images, labels in test_ds:
        predictions = model.predict(images, verbose=0)
        y_pred.extend(np.argmax(predictions, axis=1))
        y_true.extend(labels.numpy())

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    report = classification_report(y_true, y_pred, target_names=CLASS_NAMES)
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(report)

    cm = confusion_matrix(y_true, y_pred)

    save_confusion_matrix(
        cm,
        os.path.join(MODELS_DIR, "semi_supervised_confusion_matrix.png")
    )

    save_training_history(
        history1,
        history2,
        os.path.join(MODELS_DIR, "semi_supervised_training_history.png")
    )

    with open(os.path.join(MODELS_DIR, "semi_supervised_accuracy_report.txt"), "w", encoding="utf-8") as f:
        f.write("=" * 50 + "\n")
        f.write("SEMI-SUPERVISED HEALTH CLASSIFICATION REPORT\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Classes: {', '.join(CLASS_NAMES)}\n\n")
        f.write(f"Labeled train images: {len(labeled_train_paths)}\n")
        f.write(f"Pseudo-labeled images: {len(pseudo_paths)}\n")
        f.write(f"Total train images: {len(train_paths)}\n")
        f.write(f"Validation images: {len(val_paths)}\n")
        f.write(f"Test images: {len(test_paths)}\n\n")
        f.write("PHASE 1 - Transfer Learning:\n")
        f.write(f"  Best Training Accuracy: {max(history1.history['accuracy']):.4f}\n")
        f.write(f"  Best Validation Accuracy: {max(history1.history['val_accuracy']):.4f}\n\n")
        f.write("PHASE 2 - Fine-tuning:\n")
        f.write(f"  Best Training Accuracy: {max(history2.history['accuracy']):.4f}\n")
        f.write(f"  Best Validation Accuracy: {max(history2.history['val_accuracy']):.4f}\n\n")
        f.write("FINAL RESULTS:\n")
        f.write(f"  Test Accuracy: {test_acc:.4f} ({test_acc * 100:.2f}%)\n")
        f.write(f"  Test Loss: {test_loss:.4f}\n\n")
        f.write("CLASSIFICATION REPORT:\n")
        f.write(report)
        f.write("\n\nCONFUSION MATRIX:\n")
        f.write(str(cm))

    model.save(os.path.join(MODELS_DIR, "semi_supervised_final_model.keras"))

    print("\nSaved files:")
    print("✓ models/semi_supervised_best_model.keras")
    print("✓ models/semi_supervised_final_model.keras")
    print("✓ models/semi_supervised_confusion_matrix.png")
    print("✓ models/semi_supervised_training_history.png")
    print("✓ models/semi_supervised_accuracy_report.txt")


if __name__ == "__main__":
    main()