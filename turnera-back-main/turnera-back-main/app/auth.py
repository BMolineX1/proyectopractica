# app/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

import jwt
from fastapi import HTTPException, Depends, Request
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app import models

# ⚠️ en producción, usá variables de entorno
SECRET_KEY = "change-me-in-env"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h

def create_access_token(payload: Dict, expires_delta: Optional[timedelta] = None) -> str:
    data = payload.copy()
    # PyJWT exige sub string
    if "sub" in data and not isinstance(data["sub"], str):
        data["sub"] = str(data["sub"])
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    data["exp"] = int(expire.timestamp())
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.Usuario:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido o no proporcionado")

    token = auth.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user_sub = payload.get("sub")
    if not user_sub:
        raise HTTPException(status_code=401, detail="Token inválido")

    # sub viene como str → a int para la DB
    try:
        user_id = int(user_sub)
    except ValueError:
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario
