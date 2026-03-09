"""Re-save models with current Keras to fix serialization compatibility."""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import keras
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

dummy = np.random.rand(1, 224, 224, 3).astype(np.float32)

for name in ['final_model.keras', 'health_final_model.keras']:
    path = os.path.join(MODELS_DIR, name)
    print(f'Loading {name}...')
    m = keras.models.load_model(path, compile=False)
    m.predict(dummy, verbose=0)
    m.save(path)
    print(f'  Re-saved {name}')

# Verify
for name in ['final_model.keras', 'health_final_model.keras']:
    path = os.path.join(MODELS_DIR, name)
    m = keras.models.load_model(path, compile=False)
    print(f'  Verified {name} -> output shape: {m.output_shape}')

print('Done!')
