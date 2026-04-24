import os
import uuid
import imghdr
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"jpeg", "png", "gif", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024


def _get_extension(image_type: str) -> str:
    mapping = {"jpeg": "jpg", "png": "png", "gif": "gif", "webp": "webp"}
    return mapping.get(image_type, image_type)


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    # Validate content type header
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed (jpg, png, gif, webp)")

    # Read file
    data = await file.read()

    # Enforce size limit
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {settings.MAX_IMAGE_SIZE_MB}MB"
        )

    # Verify MIME type server-side using imghdr
    detected = imghdr.what(None, h=data)
    if detected not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image format detected server-side")

    # Save with UUID filename
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = _get_extension(detected)
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = upload_dir / filename

    with open(filepath, "wb") as f:
        f.write(data)

    image_url = f"/static/uploads/{filename}"
    logger.info(f"Image uploaded: {filename} by user {current_user.id}")
    return {"image_url": image_url}
