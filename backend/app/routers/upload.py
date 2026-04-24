import io
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import cloudinary
import cloudinary.uploader
from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024

cloudinary.config(
    cloud_name="dmohrr8hq",
    api_key="637167941541637",
    api_secret="ph-Jre4_0OXZT5exhkbLy8cHWrU",
    secure=True
)


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed (jpg, png, gif, webp)")

    data = await file.read()

    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {settings.MAX_IMAGE_SIZE_MB}MB"
        )

    try:
        file_buffer = io.BytesIO(data)
        file_buffer.name = file.filename or "image.jpg"
        
        upload_result = cloudinary.uploader.upload(
            file_buffer,
            folder="quiz_platform",
            transformation=[
                {"quality": "auto:good", "fetch_format": "auto"}
            ],
            resource_type="image"
        )
        image_url = upload_result["secure_url"]
        logger.info(f"Image uploaded to Cloudinary: {upload_result['public_id']} by user {current_user.id}")
        return {"image_url": image_url}
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        raise HTTPException(status_code=500, detail="Image upload failed")