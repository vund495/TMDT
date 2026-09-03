import uuid
from fastapi import APIRouter, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    """Tải lên file (ảnh sản phẩm, bằng chứng khiếu nại)."""
    # Lưu file vào thư mục uploads
    file_extension = file.filename.split(".").pop() if "." in file.filename else "bin"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_path = f"uploads/{unique_filename}"
    
    # Tạo thư mục nếu chưa tồn tại
    import os
    os.makedirs("uploads", exist_ok=True)
    
    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)
    
    file_url = f"/{upload_path}"
    return {"filename": file.filename, "url": file_url, "path": upload_path}