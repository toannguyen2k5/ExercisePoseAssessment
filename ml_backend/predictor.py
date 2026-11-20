import json
import numpy as np
from pathlib import Path
import tensorflow as tf
from tensorflow import keras

_ROOT        = Path(__file__).parent.parent
_SCALER_PATH = _ROOT / "data" / "processed" / "scaler_params.json"

LABEL_MAP = {0: "push-up", 1: "lateral raise", 2: "squat", 3: "pull Up", 4: "leg raises"}


class PositionalEncoding(keras.layers.Layer):
    def __init__(self, maxlen: int, d_model: int, **kwargs):
        super().__init__(**kwargs)
        self.maxlen  = maxlen
        self.d_model = d_model
        self.embed   = keras.layers.Embedding(input_dim=maxlen, output_dim=d_model)

    def call(self, x):
        seq_len   = tf.shape(x)[1]
        positions = tf.range(start=0, limit=seq_len, delta=1)
        pos_enc   = self.embed(positions)
        return x + pos_enc

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"maxlen": self.maxlen, "d_model": self.d_model})
        return cfg


class TransformerEncoderBlock(keras.layers.Layer):
    def __init__(self, d_model: int, num_heads: int, ff_dim: int, dropout: float = 0.1, **kwargs):
        super().__init__(**kwargs)
        self.d_model      = d_model
        self.num_heads    = num_heads
        self.ff_dim       = ff_dim
        self.dropout_rate = dropout

        self.attn  = keras.layers.MultiHeadAttention(num_heads=num_heads, key_dim=d_model // num_heads)
        self.ffn   = keras.Sequential([
            keras.layers.Dense(ff_dim, activation="relu"),
            keras.layers.Dense(d_model),
        ])
        self.norm1 = keras.layers.LayerNormalization(epsilon=1e-6)
        self.norm2 = keras.layers.LayerNormalization(epsilon=1e-6)
        self.drop1 = keras.layers.Dropout(dropout)
        self.drop2 = keras.layers.Dropout(dropout)

    def call(self, x, training=False):
        attn_out = self.attn(x, x, training=training)
        x  = self.norm1(x + self.drop1(attn_out, training=training))
        ff = self.ffn(x)
        x  = self.norm2(x + self.drop2(ff, training=training))
        return x

    def get_config(self):
        cfg = super().get_config()
        cfg.update({
            "d_model":   self.d_model,
            "num_heads": self.num_heads,
            "ff_dim":    self.ff_dim,
            "dropout":   self.dropout_rate,
        })
        return cfg


class WarmupCosineDecay(keras.optimizers.schedules.LearningRateSchedule):
    def __init__(self, d_model: int, warmup_steps: int = 1000, **kwargs):
        super().__init__(**kwargs)
        self.d_model      = tf.cast(d_model, tf.float32)
        self.warmup_steps = warmup_steps

    def __call__(self, step):
        step = tf.cast(step, tf.float32)
        arg1 = tf.math.rsqrt(step)
        arg2 = step * (self.warmup_steps ** -1.5)
        return tf.math.rsqrt(self.d_model) * tf.math.minimum(arg1, arg2)

    def get_config(self):
        return {
            "d_model":      int(self.d_model.numpy()),
            "warmup_steps": self.warmup_steps,
        }


CUSTOM_OBJECTS = {
    "PositionalEncoding":      PositionalEncoding,
    "TransformerEncoderBlock": TransformerEncoderBlock,
    "WarmupCosineDecay":       WarmupCosineDecay,
}

_scaler_cache = None


def _load_scaler() -> dict:
    global _scaler_cache
    if _scaler_cache is None:
        with open(_SCALER_PATH, "r") as f:
            _scaler_cache = json.load(f)
    return _scaler_cache


def normalize(X: np.ndarray) -> np.ndarray:
    sc    = _load_scaler()
    mean  = np.array(sc["mean"],  dtype=np.float32)
    scale = np.array(sc["scale"], dtype=np.float32)
    orig_shape = X.shape
    X_flat = X.reshape(orig_shape[0], -1).astype(np.float32)
    X_norm = (X_flat - mean) / (scale + 1e-8)
    return X_norm.reshape(orig_shape)


_model_cache: dict = {}

_MODEL_PATHS = {
    "transformer":  _ROOT / "models" / "transformer"  / "final_model.h5",
    "lstm":         _ROOT / "models" / "lstm"          / "best_model.h5",
    "lstm_vanilla": _ROOT / "models" / "lstm_vanilla"  / "best_model.h5",
}


def load_model(model_name: str = "transformer") -> keras.Model:
    if model_name in _model_cache:
        return _model_cache[model_name]
    path = _MODEL_PATHS.get(model_name)
    if path is None:
        raise ValueError("Invalid model: " + model_name)
    if not path.exists():
        raise FileNotFoundError("Model file not found: " + str(path))
    if model_name == "transformer":
        model = keras.models.load_model(str(path), custom_objects=CUSTOM_OBJECTS)
    else:
        model = keras.models.load_model(str(path))
    _model_cache[model_name] = model
    return model


def predict(sequences: np.ndarray, model_name: str = "transformer") -> dict:
    if sequences.shape[0] == 0:
        raise ValueError("No sequences to predict.")
    model  = load_model(model_name)
    X_norm = normalize(sequences)
    probs  = model.predict(X_norm, verbose=0)
    avg    = probs.mean(axis=0)
    label_id   = int(np.argmax(avg))
    confidence = float(avg[label_id])
    exercise   = LABEL_MAP[label_id]
    return {
        "exercise":   exercise,
        "confidence": confidence,
        "label_id":   label_id,
    }


def preload_all() -> None:
    for name in _MODEL_PATHS:
        try:
            load_model(name)
            print("[predictor] Loaded: " + name)
        except Exception as e:
            print("[predictor] WARNING - cannot load " + name + ": " + str(e))
