import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="VietCraft Bát Tràng - Nơi đất kể chuyện, lửa giữ hồn",
    version="0.1.0",
)

_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
if not _origins:
    _origins = ["http://localhost:5173", settings.frontend_url]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phục vụ file upload (ảnh sản phẩm, bằng chứng khiếu nại...) từ thư mục uploads
_uploads_dir = os.path.abspath(settings.uploads_dir)
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
