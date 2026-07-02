"""长期令牌 Pydantic 校验模型。"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TokenCreate(BaseModel):
    name: str
    project_id: int
    expires_at: Optional[datetime] = None


class TokenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    project_id: int
    created_by: Optional[int] = None
    is_active: bool
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class TokenCreateResponse(TokenOut):
    """创建令牌后返回明文（仅此一次）。"""
    token: str


class TokenUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
