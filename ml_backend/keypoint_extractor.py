import os
import cv2
import numpy as np
from pathlib import Path
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

_THIS_DIR   = Path(__file__).parent
_MODEL_PATH = _THIS_DIR.parent / "notebooks" / "pose_landmarker_full.task"

N_LANDMARKS = 33
N_FEATURES  = N_LANDMARKS * 3   # 99
WINDOW_SIZE = 30
STEP        = 5

_base_opts = mp_python.BaseOptions(model_asset_path=str(_MODEL_PATH))
_opts = mp_vision.PoseLandmarkerOptions(
    base_options=_base_opts,
    running_mode=mp_vision.RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.4,
    min_pose_presence_confidence=0.4,
    min_tracking_confidence=0.4,
    output_segmentation_masks=False,
)
DETECTOR = mp_vision.PoseLandmarker.create_from_options(_opts)


def extract_keypoints(frame_rgb: np.ndarray):
    """
    Input: RGB frame (H, W, 3).
    Output: np.ndarray (99,) or None if no person detected.
    """
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
    result = DETECTOR.detect(mp_img)
    if not result.pose_landmarks:
        return None
    lms = result.pose_landmarks[0]
    kp  = np.array([[lm.x, lm.y, lm.z] for lm in lms], dtype=np.float32)
    return kp.flatten()   # (99,)


def process_video_to_sequences(video_path: str, window: int = WINDOW_SIZE, step: int = STEP):
    """
    Read video -> extract keypoints per frame -> forward_fill -> sliding window.
    Returns list of np.ndarray shape (window, 99).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Cannot open video: " + video_path)

    frames_kp = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        kp = extract_keypoints(frame_rgb)
        frames_kp.append(kp)
    cap.release()

    if len(frames_kp) == 0:
        return []

    # Forward-fill None frames
    last_valid = None
    filled = []
    for kp in frames_kp:
        if kp is not None:
            last_valid = kp
        if last_valid is not None:
            filled.append(last_valid.copy())

    if len(filled) < window:
        return []

    # Sliding window
    sequences = []
    for start in range(0, len(filled) - window + 1, step):
        seq = np.stack(filled[start: start + window], axis=0)
        sequences.append(seq.astype(np.float32))

    return sequences


def frame_to_keypoints_flat(frame_rgb: np.ndarray):
    """Return list of 99 floats for 1 frame, or None if no pose detected."""
    kp = extract_keypoints(frame_rgb)
    if kp is None:
        return None
    return kp.tolist()
