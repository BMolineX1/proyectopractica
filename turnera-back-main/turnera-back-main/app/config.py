# examples/standard/app/config.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class User(BaseModel):
    username: str
    password: str
    token: Optional[str] = Field(None)


class AuthenticationSettings(BaseModel):
    secret: str = "asodiufcnp8ufni80qn0crn2u903nwcauf0unq2nc2uic90"
    jwt_algorithm: str = "HS256"
    expiration_seconds: int = 3600 * 24  # 1 hour


__all__ = ["AuthenticationSettings"]