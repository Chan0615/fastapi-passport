"""用户 Pydantic 校验模型。"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.role import RoleBrief


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False


class UserCreate(UserBase):
    password: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    display_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    roles: List[RoleBrief] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserRoleAssign(BaseModel):
    """为用户分配角色。"""
    role_ids: List[int]
