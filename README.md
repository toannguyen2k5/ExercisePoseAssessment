# 🏋️ ExercisePoseAssessment

> **Nhận diện tư thế tập luyện và chấm điểm chất lượng thực hiện**  
> Đồ án cuối kỳ — Học Máy Ứng Dụng · Nhóm 4 · 2026

---

## 📋 Tổng Quan

Hệ thống sử dụng **MediaPipe Pose** để trích xuất 33 keypoints từ video bài tập, sau đó đưa qua mô hình **Transformer Encoder** để nhận diện động tác và tính điểm chất lượng theo heuristic feedback.

| Thành phần | Công nghệ |
|-----------|----------|
| Frontend  | React 18 + TypeScript + Vite (port 5173) |
| Backend   | Node.js + Express + TypeScript (port 3001) |
| ML Backend | Python FastAPI + TensorFlow (port 8000) |
| Keypoints  | MediaPipe Tasks API — 33 landmarks × (x,y,z) = 99 features |
| Models    | Vanilla LSTM · BiLSTM · **Transformer** (winner) |

---

## 🏃 5 Bài Tập Được Hỗ Trợ

| ID | Tên | Khớp đánh giá |
|----|-----|--------------|
| 0  | Push-up | Vai → Khuỷu → Cổ tay |
| 1  | Lateral Raise | Hông → Vai → Khuỷu |
| 2  | Squat | Hông → Gối → Mắt cá |
| 3  | Pull Up | Vai → Khuỷu → Cổ tay |
| 4  | Leg Raises | Vai → Hông → Gối |

---

## 📊 Kết Quả Training (Test Set — 1061 mẫu)

| Model | Test Accuracy | F1 Macro | Epochs |
|-------|--------------|----------|--------|
| Vanilla LSTM | 84.35% | 0.8309 | 30 |
| BiLSTM | 79.36% | 0.7920 | 30 |
| **Transformer** 🏆 | **94.34%** | **0.9400** | 68 |

> **Video-level split** 70/15/15 — không data leakage.

---

## 🚀 Hướng Dẫn Chạy Dự Án

### Yêu Cầu

- **Python 3.10+** với virtual environment tại `.venv/`
- **Node.js 18+** (khuyến nghị v20+)
- **npm 9+**

### Bước 1 — Cài đặt Python packages

```powershell
# Tạo venv (nếu chưa có)
python -m venv .venv

# Kích hoạt venv
.\.venv\Scripts\Activate.ps1

# Cài packages
pip install -r ml_backend/requirements.txt
```

### Bước 2 — Cài đặt Node packages

```powershell
# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

### Bước 3 — Chạy 3 server (mỗi cái 1 terminal riêng)

#### 🟣 Terminal 1 — ML Backend (FastAPI, port 8000)

```powershell
cd d:\...\ExercisePoseAssessment\ml_backend

d:\...\Hoc_may_ung_dung\.venv\Scripts\uvicorn main:app --port 8000 --reload
```

**Chờ thấy:**
```
[predictor] Loaded: transformer
[predictor] Loaded: lstm
[predictor] Loaded: lstm_vanilla
INFO: Uvicorn running on http://0.0.0.0:8000
```

> ⚠️ Lần đầu load 3 models mất ~15–30 giây. Đừng tắt terminal.

#### 🔵 Terminal 2 — Node Backend (Express, port 3001)

```powershell
cd d:\...\ExercisePoseAssessment\backend

npx tsx src/index.ts
```

**Chờ thấy:**
```
Node Backend running on http://localhost:3001
ML Backend expected at: http://localhost:8000
```

#### 🟢 Terminal 3 — React Frontend (Vite, port 5173)

```powershell
cd d:\...\ExercisePoseAssessment\frontend

npm run dev
```

**Chờ thấy:**
```
  VITE ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Bước 4 — Mở trình duyệt

```
http://localhost:5173
```

Góc dưới sidebar hiển thị **🟢 API Online** khi cả 3 server chạy đúng.

---

## 🔍 Kiểm Tra Nhanh

```powershell
# FastAPI health check
curl http://localhost:8000/health
# → {"status":"ok","model_loaded":true,"loaded_models":["transformer","lstm","lstm_vanilla"]}

# Node status
curl http://localhost:3001/api/status
# → {"node_backend":"ok","ml_backend":"ok"}
```

---

## 📁 Cấu Trúc Thư Mục

```
ExercisePoseAssessment/
├── archive/                    # Video dataset gốc (169 videos, 5 class)
├── data/
│   └── processed/              # .npy files, scaler_params.json (244 MB — không push git)
├── models/
│   ├── lstm/best_model.h5      # BiLSTM — 79.36%
│   ├── lstm_vanilla/best_model.h5  # Vanilla LSTM — 84.35%
│   └── transformer/
│       ├── best_model.h5       # Transformer — 94.34%
│       └── final_model.h5      # Retrained 100% data (dùng cho production)
├── notebooks/
│   ├── 01_EDA.ipynb
│   ├── 02_extract_keypoints.ipynb
│   ├── 03_train_lstm.ipynb
│   ├── 04_train_transformer.ipynb
│   ├── 05_train_lstm_vanilla.ipynb
│   └── 06_comparison.ipynb
├── ml_backend/                 # FastAPI Python
│   ├── main.py
│   ├── predictor.py
│   ├── keypoint_extractor.py
│   └── angle_scorer.py
├── backend/                    # Node.js Express
│   └── src/
├── frontend/                   # React + Vite
│   └── src/
├── reports/                    # Biểu đồ so sánh
└── README.md
```

---

## 🔧 Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|-----|------------|-----|
| `Frame gửi thất bại` trên webcam | FastAPI chưa chạy | Khởi động Terminal 1 trước |
| `API Offline` trên sidebar | Node chưa chạy | Khởi động Terminal 2 |
| `ValueError: Unknown layer 'PositionalEncoding'` | Load transformer sai | `predictor.py` đã xử lý — chạy đúng file |
| `Cannot read properties of undefined` trên ts-node | Node.js v24 + ts-node không tương thích | Dùng `npx tsx` thay vì `npx ts-node` |
| Video EDA không hiển thị | Node chưa chạy hoặc chạy sai thư mục | Phải cd vào `backend/` trước khi chạy |

---

## 🗒️ Notebooks — Thứ Tự Chạy

```
01_EDA.ipynb              → Phân tích dataset
02_extract_keypoints.ipynb → MediaPipe → .npy (cần chạy 1 lần)
03_train_lstm.ipynb        → Train BiLSTM
04_train_transformer.ipynb → Train Transformer (winner)
05_train_lstm_vanilla.ipynb→ Train Vanilla LSTM
06_comparison.ipynb        → So sánh 3 model + xuất final_model.h5
```

> Tất cả notebook đã được chạy xong. Chỉ cần chạy lại nếu muốn retrain.

---

## 👥 Nhóm

Đồ án cuối kỳ — Học Máy Ứng Dụng · Đại học Duy Tân · 2026
