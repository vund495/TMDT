import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import api_router

app = FastAPI(
    title="VietCraft Bát Tràng - Nơi đất kể chuyện, lửa giữ hồn",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phục vụ file upload (ảnh sản phẩm, bằng chứng khiếu nại...) từ thư mục uploads
# Working dir của container là /app, `và upload.py` lưu vào uploads/ (tức /app/uploads).
_uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
