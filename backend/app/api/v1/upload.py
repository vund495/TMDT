import os
import uuid
from fastapi import APIRouter, UploadFile, File

from app.core.config import get_settings

router = APIRouter(prefix="/upload", tags=["Upload"])

_settings = get_settings()
_upload_root = _settings.uploads_dir


@router.post("/", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    """Tải lên file (ảnh sản phẩm, bằng chứng khiếu nại)."""
    # Lưu file vào thư mục uploads
    file_extension = file.filename.split(".").pop() if "." in file.filename else "bin"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_path = os.path.join(_upload_root, unique_filename)

    # Tạo thư mục nếu chưa tồn tại
    os.makedirs(_upload_root, exist_ok=True)

    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{unique_filename}"
    return {"filename": file.filename, "url": file_url, "path": upload_path}