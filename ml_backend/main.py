import io
import os
import tempfile
import threading
from collections import defaultdict

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from keypoint_extractor import (
    WINDOW_SIZE,
    extract_keypoints,
    process_video_to_sequences,
)
from predictor import LABEL_MAP, predict, preload_all
from angle_scorer import compute_score

app = FastAPI(title="ExercisePoseAssessment ML Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_frame_buffer: dict = defaultdict(list)
_frame_lock = threading.Lock()

DEFAULT_MODEL    = "transformer"
AVAILABLE_MODELS = ["transformer", "lstm", "lstm_vanilla"]


@app.on_event("startup")
async def startup_event():
    print("[main] Preloading models...")
    preload_all()
    print("[main] Server ready.")


class PredictResponse(BaseModel):
    exercise:         str
    confidence:       float
    score:            int
    feedback:         str
    keypoints_frames: list


@app.get("/health")
def health():
    from predictor import _model_cache
    return {
        "status":        "ok",
        "model_loaded":  len(_model_cache) > 0,
        "loaded_models": list(_model_cache.keys()),
    }


@app.get("/models")
def models():
    return {"available": AVAILABLE_MODELS, "default": DEFAULT_MODEL}


@app.post("/predict/video", response_model=PredictResponse)
async def predict_video(
    file:       UploadFile = File(...),
    model_name: str        = Form(DEFAULT_MODEL),
):
    if model_name not in AVAILABLE_MODELS:
        raise HTTPException(400, "model_name must be one of: " + str(AVAILABLE_MODELS))

    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        sequences = process_video_to_sequences(tmp_path)
    finally:
        os.unlink(tmp_path)

    if not sequences:
        raise HTTPException(422, "Video too short or no pose detected.")

    seqs_arr = np.stack(sequences, axis=0)   # (N, 30, 99)
    pred     = predict(seqs_arr, model_name)

    all_frames_kp = []
    for seq in sequences:
        for frame_kp in seq:
            all_frames_kp.append(frame_kp.tolist())

    all_kp_arr = np.array([kp for seq in sequences for kp in seq], dtype=np.float32)
    scored = compute_score(all_kp_arr, pred["exercise"])

    return PredictResponse(
        exercise=pred["exercise"],
        confidence=pred["confidence"],
        score=int(scored["score"]),
        feedback=scored["feedback"],
        keypoints_frames=all_frames_kp,
    )


@app.post("/predict/frame", response_model=PredictResponse)
async def predict_frame(
    file:       UploadFile = File(...),
    model_name: str        = Form(DEFAULT_MODEL),
):
    if model_name not in AVAILABLE_MODELS:
        raise HTTPException(400, "model_name must be one of: " + str(AVAILABLE_MODELS))

    img_bytes = await file.read()
    img_arr   = np.frombuffer(img_bytes, np.uint8)
    frame_bgr = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    if frame_bgr is None:
        raise HTTPException(422, "Cannot decode image frame.")
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

    kp = extract_keypoints(frame_rgb)

    with _frame_lock:
        buf = _frame_buffer[model_name]
        if kp is not None:
            buf.append(kp)
            if len(buf) > 60:
                buf.pop(0)
        n_frames = len(buf)

        if n_frames < WINDOW_SIZE:
            kp_flat = kp.tolist() if kp is not None else [0.0] * 99
            return PredictResponse(
                exercise="...",
                confidence=0.0,
                score=0,
                feedback="Dang tich luy frame (%d/%d)..." % (n_frames, WINDOW_SIZE),
                keypoints_frames=[kp_flat],
            )

        window    = np.stack(buf[-WINDOW_SIZE:], axis=0)
        kp_frames = window.tolist()

    seqs_arr = window[np.newaxis, ...]
    pred     = predict(seqs_arr, model_name)
    scored   = compute_score(window, pred["exercise"])

    return PredictResponse(
        exercise=pred["exercise"],
        confidence=pred["confidence"],
        score=int(scored["score"]),
        feedback=scored["feedback"],
        keypoints_frames=kp_frames,
    )


@app.delete("/predict/frame/reset")
def reset_frame_buffer(model_name: str = DEFAULT_MODEL):
    with _frame_lock:
        _frame_buffer[model_name].clear()
    return {"status": "reset", "model_name": model_name}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
