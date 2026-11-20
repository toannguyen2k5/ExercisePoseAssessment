import sys, subprocess

# 1. Check/install tensorflow
print("[1] Checking TensorFlow...")
try:
    import tensorflow as tf
    print(f"    tensorflow: {tf.__version__}")
    print(f"    GPU devices: {tf.config.list_physical_devices('GPU')}")
    print(f"    CPU devices: {tf.config.list_physical_devices('CPU')}")
except ImportError:
    print("    Not installed — installing...")
    subprocess.run([sys.executable, "-m", "pip", "install", "tensorflow", "--quiet"], check=True)
    import tensorflow as tf
    print(f"    tensorflow: {tf.__version__}")

# 2. Check numpy compatibility
print("\n[2] Numpy check...")
import numpy as np
print(f"    numpy: {np.__version__}")
# TF 2.x needs numpy < 2.0 in some versions
arr = np.zeros((10, 30, 99), dtype=np.float32)
t = tf.constant(arr)
print(f"    np->tf tensor OK: {t.shape}")

# 3. Check sklearn
print("\n[3] Sklearn check...")
from sklearn.utils.class_weight import compute_class_weight
print("    sklearn compute_class_weight: OK")

# 4. Check tqdm (plain, no notebook)
print("\n[4] tqdm check...")
from tqdm import tqdm
for _ in tqdm(range(3), desc="test"):
    pass
print("    tqdm plain: OK")

# 5. Build a tiny LSTM model to verify no errors
print("\n[5] LSTM model build test...")
from tensorflow import keras
from tensorflow.keras import layers

def build_test_model():
    inp = keras.Input(shape=(30, 99))
    x = layers.Masking(mask_value=0.0)(inp)
    x = layers.LSTM(32, return_sequences=True)(x)
    x = layers.LSTM(16)(x)
    x = layers.Dense(5, activation='softmax')(x)
    model = keras.Model(inp, x)
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model

m = build_test_model()
print(f"    Model params: {m.count_params():,}")
# Quick forward pass
dummy_x = np.random.randn(4, 30, 99).astype(np.float32)
dummy_y = np.array([0,1,2,3])
m.fit(dummy_x, dummy_y, epochs=1, verbose=0)
print("    LSTM forward+train pass: OK")

# 6. Build a tiny Transformer model
print("\n[6] Transformer model build test...")
class TransformerBlock(layers.Layer):
    def __init__(self, embed_dim, num_heads, ff_dim, dropout=0.1, **kw):
        super().__init__(**kw)
        self.att  = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim//num_heads)
        self.ffn  = keras.Sequential([layers.Dense(ff_dim, activation='relu'), layers.Dense(embed_dim)])
        self.ln1  = layers.LayerNormalization(epsilon=1e-6)
        self.ln2  = layers.LayerNormalization(epsilon=1e-6)
        self.drop1= layers.Dropout(dropout)
        self.drop2= layers.Dropout(dropout)
    def call(self, x, training=False):
        attn = self.att(x, x)
        x = self.ln1(x + self.drop1(attn, training=training))
        ffn = self.ffn(x)
        return self.ln2(x + self.drop2(ffn, training=training))

inp = keras.Input(shape=(30, 99))
x = layers.Dense(64)(inp)
x = TransformerBlock(64, 4, 128)(x)
x = layers.GlobalAveragePooling1D()(x)
x = layers.Dense(5, activation='softmax')(x)
tm = keras.Model(inp, x)
tm.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
tm.fit(dummy_x, dummy_y, epochs=1, verbose=0)
print(f"    Transformer params: {tm.count_params():,}")
print("    Transformer forward+train pass: OK")

print("\n" + "="*50)
print("ALL CHECKS PASSED — Ready to train!")
print("="*50)

