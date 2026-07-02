"""JWT 令牌与密码安全工具。

JWT payload 中包含 project_code，业务系统可使用共享的 secret_key 本地验证令牌，
无需每次请求都调用 passport。
"""
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.config import bootstrap_config

# ────── 配置 ──────
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 小时

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _get_secret_key() -> str:
    key = bootstrap_config.security.secret_key
    if not key or key == "change-me-in-production":
        key = "fastapi_passport-default-secret-change-in-production"
    return key


# ────── 密码工具 ──────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    return pwd_context.verify(plain, hashed)


# ────── JWT 令牌 ──────

class TokenPayload(BaseModel):
    sub: str  # user_id (str)
    username: str
    project_code: str = ""  # 登录时的项目标识
    exp: Optional[datetime] = None


def create_access_token(user_id: int, username: str, project_code: str = "") -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "username": username,
        "project_code": project_code,
        "exp": expire,
    }
    return jwt.encode(payload, _get_secret_key(), algorithm=ALGORITHM)


def decode_access_token(token: str, verify_exp: bool = True) -> Optional[TokenPayload]:
    try:
        payload = jwt.decode(
            token, _get_secret_key(), algorithms=[ALGORITHM],
            options={"verify_exp": verify_exp},
        )
        return TokenPayload(**payload)
    except JWTError:
        return None
