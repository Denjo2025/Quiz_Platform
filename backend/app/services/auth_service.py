from datetime import datetime, timedelta
from typing import Optional
import hashlib
import hmac
import logging
import os
import secrets

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()

ALGORITHM = "HS256"
HASH_ITERATIONS = 260_000  # PBKDF2 iterations (OWASP recommendation)


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 (stdlib only, no extra deps)."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), HASH_ITERATIONS
    )
    return f"pbkdf2:{salt}:{key.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a stored hash."""
    try:
        _, salt, stored_hex = hashed.split(":", 2)
        key = hashlib.pbkdf2_hmac(
            "sha256", plain.encode("utf-8"), salt.encode("utf-8"), HASH_ITERATIONS
        )
        return hmac.compare_digest(key.hex(), stored_hex)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        logger.warning("[AUTH] No credentials provided")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No credentials provided")
    token = credentials.credentials
    logger.info(f"[AUTH] Token received: {token[:30]}...")
    payload = decode_token(token)
    if not payload:
        logger.warning("[AUTH] Token decode failed")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id: int = payload.get("sub")
    if user_id is None:
        logger.warning("[AUTH] No sub in token payload")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        logger.warning(f"[AUTH] User not found: id={user_id}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    logger.info(f"[AUTH] User authenticated: {user.email}")
    return user
