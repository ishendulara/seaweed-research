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

tf.config.threading.set_inter_op_parallelism_threads(2)
tf.config.threading.set_intra_op_parallelism_threads(2)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "dataset", "labeled")
MODELS_DIR = os.path.join(BASE_DIR, "models")

IMG_SIZE = (224, 224)
BATCH = 16
SEED = 42

os.makedirs(MODELS_DIR, exist_ok=True)

train_ds = tf.keras.utils.image_dataset_from_directory(
    os.path.join(DATA_DIR, "train"),
    image_size=IMG_SIZE,
    batch_size=BATCH,
    seed=SEED
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    os.path.join(DATA_DIR, "val"),
    image_size=IMG_SIZE,
    batch_size=BATCH,
    seed=SEED
)

test_ds = tf.keras.utils.image_dataset_from_directory(
    os.path.join(DATA_DIR, "test"),
    image_size=IMG_SIZE,
    batch_size=BATCH,
    seed=SEED,
    shuffle=False
)

class_names = train_ds.class_names
print("Health classes:", class_names)

with open(os.path.join(MODELS_DIR, "health_class_names.txt"), "w", encoding="utf-8") as f:
    for name in class_names:
        f.write(name + "\n")

data_augmentation = keras.Sequential([
    layers.RandomFlip("horizontal_and_vertical"),
    layers.RandomRotation(0.3),
    layers.RandomZoom(0.2),
    layers.RandomContrast(0.2),
    layers.RandomTranslation(0.1, 0.1),
])

AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
test_ds = test_ds.cache().prefetch(buffer_size=AUTOTUNE)

y_train = np.concatenate([y.numpy() for _, y in train_ds.unbatch().batch(10_000)])
classes = np.unique(y_train)
weights = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
class_weight = {int(c): float(w) for c, w in zip(classes, weights)}
print("class_weight:", class_weight)

base = keras.applications.EfficientNetV2B0(
    include_top=False,
    input_shape=(224, 224, 3),
    weights="imagenet"
)
base.trainable = False

inputs = keras.Input(shape=(224, 224, 3))
x = data_augmentation(inputs)
x = keras.applications.efficientnet_v2.preprocess_input(x)
x = base(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.BatchNormalization()(x)
x = layers.Dropout(0.3)(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.BatchNormalization()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(len(class_names), activation="softmax", dtype="float32")(x)

model = keras.Model(inputs, outputs)

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
        os.path.join(MODELS_DIR, "health_best_model.keras"),
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
print("PHASE 1: Transfer Learning")
print("=" * 50)

history = model.fit(
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
print("INITIAL HEALTH MODEL EVALUATION")
print("=" * 50)

test_loss, test_acc = model.evaluate(test_ds)
print(f"Test Loss: {test_loss:.4f}")
print(f"Test Accuracy: {test_acc:.4f} ({test_acc * 100:.2f}%)")

y_true = []
y_pred = []
y_pred_proba = []

for images, labels in test_ds:
    predictions = model.predict(images, verbose=0)
    y_pred_proba.extend(predictions)
    y_pred.extend(np.argmax(predictions, axis=1))
    y_true.extend(labels.numpy())

y_true = np.array(y_true)
y_pred = np.array(y_pred)
y_pred_proba = np.array(y_pred_proba)

print("\n" + "=" * 50)
print("CLASSIFICATION REPORT")
print("=" * 50)
print(classification_report(y_true, y_pred, target_names=class_names))

cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=class_names,
    yticklabels=class_names
)
plt.title("Health Model Confusion Matrix", fontsize=14, fontweight="bold")
plt.ylabel("True Label")
plt.xlabel("Predicted Label")
plt.tight_layout()
plt.savefig(os.path.join(MODELS_DIR, "health_confusion_matrix.png"), dpi=300, bbox_inches="tight")

max_probs = np.max(y_pred_proba, axis=1)
correct_mask = (y_pred == y_true)

if np.any(correct_mask):
    threshold_90_recall = np.percentile(max_probs[correct_mask], 10)
    threshold_95_recall = np.percentile(max_probs[correct_mask], 5)
else:
    threshold_90_recall = 0.90
    threshold_95_recall = 0.95

print(f"Recommended threshold for 90% recall: {threshold_90_recall:.4f}")
print(f"Recommended threshold for 95% recall: {threshold_95_recall:.4f}")

train_acc_final = history2.history["accuracy"][-1]
val_acc_final = history2.history["val_accuracy"][-1]

with open(os.path.join(MODELS_DIR, "health_accuracy_report.txt"), "w", encoding="utf-8") as f:
    f.write("=" * 50 + "\n")
    f.write("INITIAL HEALTH CLASSIFICATION MODEL REPORT\n")
    f.write("=" * 50 + "\n\n")
    f.write(f"Classes: {', '.join(class_names)}\n\n")
    f.write("PHASE 1 - Transfer Learning:\n")
    f.write(f"  Best Training Accuracy: {max(history.history['accuracy']):.4f}\n")
    f.write(f"  Best Validation Accuracy: {max(history.history['val_accuracy']):.4f}\n\n")
    f.write("PHASE 2 - Fine-tuning:\n")
    f.write(f"  Best Training Accuracy: {max(history2.history['accuracy']):.4f}\n")
    f.write(f"  Best Validation Accuracy: {max(history2.history['val_accuracy']):.4f}\n\n")
    f.write("FINAL RESULTS:\n")
    f.write(f"  Training Accuracy: {train_acc_final:.4f}\n")
    f.write(f"  Validation Accuracy: {val_acc_final:.4f}\n")
    f.write(f"  Test Accuracy: {test_acc:.4f}\n")
    f.write(f"  Test Loss: {test_loss:.4f}\n\n")
    f.write("CONFIDENCE THRESHOLDS:\n")
    f.write(f"  Recommended threshold (90% recall): {threshold_90_recall:.4f}\n")
    f.write(f"  Recommended threshold (95% recall): {threshold_95_recall:.4f}\n\n")
    f.write("CLASSIFICATION REPORT:\n")
    f.write(classification_report(y_true, y_pred, target_names=class_names))
    f.write("\n\nCONFUSION MATRIX:\n")
    f.write(str(cm))

train_acc_all = history.history["accuracy"] + history2.history["accuracy"]
val_acc_all = history.history["val_accuracy"] + history2.history["val_accuracy"]
train_loss_all = history.history["loss"] + history2.history["loss"]
val_loss_all = history.history["val_loss"] + history2.history["val_loss"]
phase1_epochs = len(history.history["accuracy"])
epochs = range(1, len(train_acc_all) + 1)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

ax1.plot(epochs, train_acc_all, label="Training Accuracy", linewidth=2)
ax1.plot(epochs, val_acc_all, label="Validation Accuracy", linewidth=2)
ax1.axvline(x=phase1_epochs, color="green", linestyle="--", label="Fine-tuning starts", alpha=0.7)
ax1.set_xlabel("Epoch")
ax1.set_ylabel("Accuracy")
ax1.set_title("Health Model Accuracy")
ax1.legend(loc="lower right")
ax1.grid(True, alpha=0.3)

ax2.plot(epochs, train_loss_all, label="Training Loss", linewidth=2)
ax2.plot(epochs, val_loss_all, label="Validation Loss", linewidth=2)
ax2.axvline(x=phase1_epochs, color="green", linestyle="--", label="Fine-tuning starts", alpha=0.7)
ax2.set_xlabel("Epoch")
ax2.set_ylabel("Loss")
ax2.set_title("Health Model Loss")
ax2.legend(loc="upper right")
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(MODELS_DIR, "health_training_history.png"), dpi=300, bbox_inches="tight")

model.save(os.path.join(MODELS_DIR, "health_final_model.keras"))

print("✓ Saved best model to: models/health_best_model.keras")
print("✓ Saved final model to: models/health_final_model.keras")
print("✓ Saved class names to: models/health_class_names.txt")
print("✓ Saved report to: models/health_accuracy_report.txt")
print("✓ Saved confusion matrix to: models/health_confusion_matrix.png")
print("✓ Saved training history to: models/health_training_history.png")