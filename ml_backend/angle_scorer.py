import numpy as np
from typing import Union

LM = {
    "NOSE": 0,
    "LEFT_EYE_IN": 1, "LEFT_EYE": 2, "LEFT_EYE_OUT": 3,
    "RIGHT_EYE_IN": 4, "RIGHT_EYE": 5, "RIGHT_EYE_OUT": 6,
    "LEFT_EAR": 7, "RIGHT_EAR": 8,
    "MOUTH_L": 9, "MOUTH_R": 10,
    "LEFT_SHOULDER": 11, "RIGHT_SHOULDER": 12,
    "LEFT_ELBOW": 13, "RIGHT_ELBOW": 14,
    "LEFT_WRIST": 15, "RIGHT_WRIST": 16,
    "LEFT_PINKY": 17, "RIGHT_PINKY": 18,
    "LEFT_INDEX": 19, "RIGHT_INDEX": 20,
    "LEFT_THUMB": 21, "RIGHT_THUMB": 22,
    "LEFT_HIP": 23, "RIGHT_HIP": 24,
    "LEFT_KNEE": 25, "RIGHT_KNEE": 26,
    "LEFT_ANKLE": 27, "RIGHT_ANKLE": 28,
    "LEFT_HEEL": 29, "RIGHT_HEEL": 30,
    "LEFT_FOOT": 31, "RIGHT_FOOT": 32,
}


def _get_xyz(kp_flat: np.ndarray, idx: int) -> np.ndarray:
    return kp_flat[idx * 3: idx * 3 + 3]


def _angle_deg(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    ba = a - b
    bc = c - b
    cos_val = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    cos_val = np.clip(cos_val, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_val)))


def _score_pushup(frames: np.ndarray):
    angles = []
    for kp in frames:
        for side in [("LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
                     ("RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST")]:
            a = _get_xyz(kp, LM[side[0]])
            b = _get_xyz(kp, LM[side[1]])
            c = _get_xyz(kp, LM[side[2]])
            angles.append(_angle_deg(a, b, c))
    if not angles:
        return 50, "Khong phat hien du keypoints."
    min_ang = min(angles)
    max_ang = max(angles)
    score = 100
    if min_ang < 55:
        score -= 20
        fb_down = "Gap khuy tay qua sau (%d deg)" % int(min_ang)
    elif min_ang > 110:
        score -= 25
        fb_down = "Chua gap du sau (%d deg, can <= 90)" % int(min_ang)
    else:
        fb_down = "Goc gap khuy tay tot (%d deg)" % int(min_ang)
    if max_ang < 140:
        score -= 20
        fb_up = "Chua duoi thang tay (%d deg)" % int(max_ang)
    else:
        fb_up = "Duoi thang tay tot (%d deg)" % int(max_ang)
    score = max(0, min(100, score))
    return score, "[Push-up] %s. %s." % (fb_down, fb_up)


def _score_lateral_raise(frames: np.ndarray):
    angles = []
    for kp in frames:
        for side in [("LEFT_HIP", "LEFT_SHOULDER", "LEFT_ELBOW"),
                     ("RIGHT_HIP", "RIGHT_SHOULDER", "RIGHT_ELBOW")]:
            a = _get_xyz(kp, LM[side[0]])
            b = _get_xyz(kp, LM[side[1]])
            c = _get_xyz(kp, LM[side[2]])
            angles.append(_angle_deg(a, b, c))
    if not angles:
        return 50, "Khong phat hien du keypoints."
    max_ang = max(angles)
    score = 100
    if max_ang < 60:
        score -= 30
        fb = "Nang tay chua du cao (%d deg, can ~90)" % int(max_ang)
    elif max_ang > 120:
        score -= 15
        fb = "Nang tay hoi qua cao (%d deg)" % int(max_ang)
    else:
        fb = "Bien do nang tay tot (%d deg)" % int(max_ang)
    score = max(0, min(100, score))
    return score, "[Lateral Raise] %s." % fb


def _score_squat(frames: np.ndarray):
    angles = []
    for kp in frames:
        for side in [("LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"),
                     ("RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE")]:
            a = _get_xyz(kp, LM[side[0]])
            b = _get_xyz(kp, LM[side[1]])
            c = _get_xyz(kp, LM[side[2]])
            angles.append(_angle_deg(a, b, c))
    if not angles:
        return 50, "Khong phat hien du keypoints."
    min_ang = min(angles)
    score = 100
    if min_ang < 55:
        score -= 20
        fb = "Xuong qua sau (%d deg), de gay ap luc goi" % int(min_ang)
    elif min_ang > 110:
        score -= 25
        fb = "Chua xuong du sau (%d deg, can <= 90)" % int(min_ang)
    else:
        fb = "Do sau squat tot (%d deg)" % int(min_ang)
    score = max(0, min(100, score))
    return score, "[Squat] %s." % fb


def _score_pullup(frames: np.ndarray):
    angles = []
    for kp in frames:
        for side in [("LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
                     ("RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST")]:
            a = _get_xyz(kp, LM[side[0]])
            b = _get_xyz(kp, LM[side[1]])
            c = _get_xyz(kp, LM[side[2]])
            angles.append(_angle_deg(a, b, c))
    if not angles:
        return 50, "Khong phat hien du keypoints."
    min_ang = min(angles)
    max_ang = max(angles)
    score = 100
    if min_ang > 110:
        score -= 30
        fb_up = "Chua keo du cao (%d deg)" % int(min_ang)
    else:
        fb_up = "Bien do keo len tot (%d deg)" % int(min_ang)
    if max_ang < 140:
        score -= 20
        fb_down = "Chua duoi thang tay khi tha (%d deg)" % int(max_ang)
    else:
        fb_down = "Duoi tay hoan toan khi ha (%d deg)" % int(max_ang)
    score = max(0, min(100, score))
    return score, "[Pull-up] %s. %s." % (fb_up, fb_down)


def _score_leg_raises(frames: np.ndarray):
    angles = []
    for kp in frames:
        for side in [("LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"),
                     ("RIGHT_SHOULDER", "RIGHT_HIP", "RIGHT_KNEE")]:
            a = _get_xyz(kp, LM[side[0]])
            b = _get_xyz(kp, LM[side[1]])
            c = _get_xyz(kp, LM[side[2]])
            angles.append(_angle_deg(a, b, c))
    if not angles:
        return 50, "Khong phat hien du keypoints."
    min_ang = min(angles)
    score = 100
    if min_ang > 120:
        score -= 30
        fb = "Chua nang chan du cao (%d deg, can < 90)" % int(min_ang)
    elif min_ang < 60:
        score -= 10
        fb = "Nang chan rat tot (%d deg)" % int(min_ang)
    else:
        fb = "Bien do nang chan tot (%d deg)" % int(min_ang)
    score = max(0, min(100, score))
    return score, "[Leg Raises] %s." % fb


_SCORERS = {
    "push-up":       _score_pushup,
    "lateral raise": _score_lateral_raise,
    "squat":         _score_squat,
    "pull Up":       _score_pullup,
    "leg raises":    _score_leg_raises,
}


def compute_score(frames_kp: Union[np.ndarray, list], exercise: str) -> dict:
    """
    frames_kp: (N, 99) array or list of (99,) arrays.
    Returns: {score: int, feedback: str}
    Note: heuristic feedback based on keypoint observation, not academic scoring.
    """
    frames = np.array(frames_kp, dtype=np.float32)
    if frames.ndim != 2 or frames.shape[1] != 99:
        return {"score": 50, "feedback": "Du lieu keypoints khong dung dinh dang."}
    scorer = _SCORERS.get(exercise)
    if scorer is None:
        return {"score": 50, "feedback": "Chua co quy tac danh gia cho bai: " + exercise}
    score, feedback = scorer(frames)
    return {"score": score, "feedback": feedback}
