# 🏋️ ExercisePoseAssessment — Kế Hoạch Dự Án (v6 — Final)

> **Folder:** `D:\University_DUT\Semester7\Hoc_may_ung_dung\Project_CK\ExercisePoseAssessment\`  
> **Stack:** React 18 + TypeScript + Vite · Node.js + Express · Python FastAPI · TensorFlow · MediaPipe  
> **Cập nhật:** 2026-11-20 (Sprint 3 hoàn thành)

---

## 📊 Kết Quả Training (Test Set Thực Tế)

> [!IMPORTANT]
> Tất cả accuracy đo trên **test set** (1 061 mẫu, video-level split, **không leakage**).  
> **KHÔNG dùng train_acc = 100%** khi trình bày với thầy.

| Model | Notebook | Test Accuracy | F1 Macro | Ghi chú |
|-------|----------|--------------|----------|---------|
| Vanilla LSTM | 05 | **84.35%** | 0.8309 | 1 chiều, baseline |
| BiLSTM | 03 | **79.36%** | 0.7920 | 2 chiều, leg raises yếu (45%) |
| **Transformer** | 04 | **94.34%** | **0.9400** | 🏆 Winner — dùng cho production |

---

## 📁 Cấu Trúc File (Thực Tế)

```
ExercisePoseAssessment\
│
├── archive\                         ← Video dataset gốc (GIỮ NGUYÊN)
│   ├── push-up\        (56 videos)
│   ├── lateral raise\  (37 videos)
│   ├── squat\          (29 videos)
│   ├── pull Up\        (26 videos)
│   └── leg raises\     (21 videos)
│
├── data\
│   └── processed\                   ✅ Có dữ liệu (video-level split)
│       ├── X_train.npy   (19224, 30, 99)
│       ├── X_val.npy     (1247,  30, 99)
│       ├── X_test.npy    (1061,  30, 99)
│       ├── y_*.npy
│       ├── label_map.json
│       ├── scaler_params.json        ← mean/scale (2970,) dùng để normalize
│       └── split_info.json           ← "video-level split (no leakage)"
│
├── notebooks\
│   ├── 01_EDA.ipynb                 ✅ DONE
│   ├── 02_extract_keypoints.ipynb   ✅ DONE
│   ├── 03_train_lstm.ipynb          ✅ DONE — BiLSTM 79.36%
│   ├── 04_train_transformer.ipynb   ✅ DONE — Transformer 94.34%
│   ├── 05_train_lstm_vanilla.ipynb  ✅ DONE — Vanilla LSTM 84.35%
│   └── 06_comparison.ipynb          ✅ DONE — 3-model comparison
│
├── models\
│   ├── lstm\best_model.h5           (4.94 MB) — BiLSTM
│   ├── lstm_vanilla\best_model.h5   (6.79 MB) — Vanilla LSTM
│   └── transformer\
│       ├── best_model.h5            (3.63 MB)
│       └── final_model.h5           (3.63 MB) ← PRODUCTION (retrained 100% data)
│
├── reports\
│   ├── comparison_report.json       ✅ 3-model metrics
│   ├── comparison_bar.png           ✅
│   └── comparison_confusion_matrix.png ✅
│
├── ml_backend\                      ✅ Sprint 3 DONE
│   ├── main.py                      FastAPI: /predict/video + /predict/frame
│   ├── predictor.py                 Load 3 models + normalize
│   ├── keypoint_extractor.py        MediaPipe Tasks API, sliding window
│   └── angle_scorer.py              Heuristic scoring 5 bài tập
│
├── backend\                         ✅ Node.js Express (port 3001)
│   └── src\
│       ├── routes\predictRoute.ts   /predict/video + /predict/frame + /predict/frames
│       ├── routes\videoRoute.ts     Stream archive videos
│       ├── routes\statusRoute.ts    Health check → FastAPI
│       └── services\mlService.ts    Proxy tới FastAPI port 8000
│
├── frontend\                        ✅ React Vite (port 5173)
│   └── src\
│       ├── pages\DashboardPage.tsx  Tổng quan + pipeline
│       ├── pages\EDAPage.tsx        Video browser, bar chart
│       ├── pages\ModelPage.tsx      3-model comparison, real training curves
│       ├── pages\UploadPage.tsx     Upload video → predict + score + skeleton
│       ├── pages\WebcamPage.tsx     Webcam real-time + skeleton overlay
│       ├── components\ui\PoseCanvas.tsx     Skeleton 33 landmarks + toggle
│       ├── components\ui\ModelSelector.tsx  3 options
│       ├── components\ui\ActivityLog.tsx    Export log .txt
│       └── services\api.ts          axios client, timeout 120s
│
├── .gitignore                       ✅ Bỏ: .npy, .h5, node_modules, .venv, videos
└── README.md                        ✅ Hướng dẫn chạy đầy đủ
```

---

## 🏛️ Kiến Trúc Models

### Vanilla LSTM (notebook 05)
```
Input (30, 99)
  → LSTM(256, return_seq=True)  → BatchNorm → Dropout(0.3)
  → LSTM(128, return_seq=False) → BatchNorm → Dropout(0.3)
  → Dense(128, relu) → Dropout(0.3) → Dense(64, relu) → Dropout(0.2)
  → Dense(5, softmax)
```

### BiLSTM (notebook 03)
```
Input (30, 99)
  → Bidirectional(LSTM 128) → BatchNorm → Dropout(0.3)
  → Bidirectional(LSTM 64)  → BatchNorm → Dropout(0.3)
  → Dense(128, relu) → Dropout(0.3) → Dense(64, relu) → Dropout(0.2)
  → Dense(5, softmax)
  Params: 424,453
```

### Transformer Encoder (notebook 04) — WINNER
```
Input (30, 99)
  → Dense(128) → LayerNorm → PositionalEncoding (learnable)
  → 2× TransformerEncoderBlock(embed=128, heads=4, ff=256, dropout=0.15)
  → GlobalAveragePooling1D
  → Dense(128, gelu) → Dropout → Dense(64, gelu) → Dropout
  → Dense(5, softmax)
  Params: 306,949 | Optimizer: AdamW + WarmupCosineDecay
```

---

## 🎯 Pipeline ML

```
Video (.mp4/.avi)
  → OpenCV: đọc frame
  → MediaPipe PoseLandmarker (Tasks API): 33 × (x,y,z) = 99 features/frame
  → Forward fill nếu không detect pose
  → Sliding window: 30 frames, step 5
  → Video-level split: 70% train / 15% val / 15% test  ← KHÔNG leakage
  → Augmentation (train only 4×): flip + slow + noise + flip+noise
  → StandardScaler (fit trên train only)
  → Output: (N, 30, 99) float32
```

---

## 🌐 Kiến Trúc Hệ Thống

```
PORT 5173  React Frontend
  ↕ axios REST (timeout 120s)
PORT 3001  Node.js Express (proxy + file serving)
  ↕ axios REST
PORT 8000  Python FastAPI (ML — 100% offline)
  → MediaPipe → Transformer → AngleScorer
```

---

## 📐 Heuristic Scoring

> [!NOTE]
> **Heuristic feedback** — ước lượng định tính từ góc khớp, không phải ground truth.  
> Trình bày với thầy: *"rule-based dựa trên nguyên tắc biomechanics cơ bản"*

| Động tác | Khớp đo | Tiêu chí |
|----------|---------|---------|
| push-up | shoulder–elbow–wrist | Xuống: ≤90°, Lên: ≥150° |
| lateral raise | hip–shoulder–elbow | Nâng: 70–110° |
| squat | hip–knee–ankle | Xuống: ≤90° |
| pull Up | shoulder–elbow–wrist | Kéo: ≤80°, Thả: ≥140° |
| leg raises | shoulder–hip–knee | Nâng: ≤90° |

---

## ✅ Checklist Sprint

### Sprint 1 — Data Pipeline ✅
- [x] Dataset: 5 class, 169 videos
- [x] 01_EDA: thống kê, phân tích
- [x] 02_extract: video-level split, 4× augment → X_train(19224), X_val(1247), X_test(1061)
- [x] scaler_params.json, split_info.json

### Sprint 2 — Training ✅
- [x] 03_train_lstm (BiLSTM): test_acc = 79.36%
- [x] 04_train_transformer: test_acc = 94.34% → WINNER
- [x] 05_train_lstm_vanilla: test_acc = 84.35%
- [x] 06_comparison: so sánh 3 model, final_model.h5 lưu
- [x] reports/: comparison_report.json, biểu đồ

### Sprint 3 — Backend + Demo ✅
- [x] ml_backend/ — 4 files Python hoàn chỉnh
- [x] Node.js backend — routes + mlService proxy
- [x] React frontend — 5 pages
- [x] PoseCanvas skeleton — 33 landmarks + 28 connections
- [x] Skeleton toggle ON/OFF (người dùng bật/tắt tự do)
- [x] ActivityLog + Export .txt
- [x] ModelSelector — 3 options
- [x] Tab Model — dữ liệu thật từ comparison_report.json
- [x] Training curves — dữ liệu thật từ training_history.json
- [x] .gitignore + README.md

---

## 🚀 Khởi Động (Xem README.md để hướng dẫn chi tiết)

```powershell
# Terminal 1 — FastAPI
cd ml_backend
..\..\..\Hoc_may_ung_dung\.venv\Scripts\uvicorn main:app --port 8000 --reload

# Terminal 2 — Node
cd backend
npx tsx src/index.ts

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Mở **http://localhost:5173**

