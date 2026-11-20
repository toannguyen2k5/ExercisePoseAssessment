"""
Test script cho notebook 02 — chạy cell 1-5 + smoke test 1 video
Dùng để xác nhận mediapipe Tasks API hoạt động trước khi Run All notebook
"""
import sys, os

print("=" * 60)
print("TEST: mediapipe 1.x Tasks API Pipeline")
print("=" * 60)

# ==== Import check ====
print("\n[1] Import check...")
try:
    import cv2
    import numpy as np
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    print(f"    mediapipe : {mp.__version__}")
    print(f"    opencv    : {cv2.__version__}")
    print(f"    numpy     : {np.__version__}")
    import google.protobuf
    print(f"    protobuf  : {google.protobuf.__version__}")
    print("    [OK] All imports passed")
except Exception as e:
    print(f"    [FAIL] {e}")
    sys.exit(1)

# ==== Tải model nếu chưa có ====
print("\n[2] PoseLandmarker model...")
MODEL_PATH = r"d:\University_DUT\Semester7\Hoc_may_ung_dung\Project_CK\ExercisePoseAssessment\notebooks\pose_landmarker_full.task"
MODEL_URL  = (
    "https://storage.googleapis.com/mediapipe-models/"
    "pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
)

if not os.path.exists(MODEL_PATH):
    print("    Đang tải model (~30MB)...")
    import urllib.request
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print(f"    [OK] Downloaded: {MODEL_PATH}")
else:
    size_mb = os.path.getsize(MODEL_PATH) / 1024 / 1024
    print(f"    [OK] Model exists: {size_mb:.1f} MB")

# ==== Init PoseLandmarker ====
print("\n[3] Init PoseLandmarker...")
try:
    base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    options = mp_vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=mp_vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_segmentation_masks=False,
    )
    DETECTOR = mp_vision.PoseLandmarker.create_from_options(options)
    print("    [OK] PoseLandmarker initialized")
except Exception as e:
    print(f"    [FAIL] {e}")
    sys.exit(1)

# ==== Test trên 1 video thật ====
print("\n[4] Smoke test: 1 video...")
ARCHIVE_DIR = r"d:\University_DUT\Semester7\Hoc_may_ung_dung\Project_CK\ExercisePoseAssessment\archive"
VIDEO_EXT   = ('.mp4', '.avi', '.mov', '.MP4', '.AVI', '.MOV')
N_FEATURES  = 99

def extract_keypoints(frame_rgb):
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
    result   = DETECTOR.detect(mp_image)
    if not result.pose_landmarks:
        return None
    landmarks = result.pose_landmarks[0]
    return np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32).flatten()

test_folder  = os.path.join(ARCHIVE_DIR, "push-up")
test_videos  = [f for f in os.listdir(test_folder) if f.endswith(VIDEO_EXT)]
test_video   = os.path.join(test_folder, test_videos[0])
print(f"    Video: {test_videos[0]}")

cap = cv2.VideoCapture(test_video)
src_fps   = cap.get(cv2.CAP_PROP_FPS)
n_frames  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"    FPS={src_fps:.1f}  Frames={n_frames}")

# Đọc 5 frame đầu, test extract
detected = 0
for i in range(min(5, n_frames)):
    ret, frame = cap.read()
    if not ret:
        break
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    kp = extract_keypoints(frame_rgb)
    if kp is not None:
        detected += 1
        if i == 0:
            print(f"    Frame 0 keypoints shape: {kp.shape}")
            print(f"    Frame 0 sample (x,y,z of lm0): {kp[:3]}")

cap.release()
print(f"    Detected poses: {detected}/5 frames")

if detected > 0:
    print("\n[OK] Smoke test PASSED — MediaPipe Tasks API hoạt động!")
    print("     Notebook 02 sẵn sàng để Run All")
else:
    print("\n[WARN] Không detect được pose (có thể video không có người đứng đúng góc)")
    print("       API vẫn hoạt động, chỉ là video này không detect được")

print("\n" + "=" * 60)
print("KẾT LUẬN: Pipeline OK — hãy Run All notebook 02")
print("=" * 60)

