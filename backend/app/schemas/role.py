"""角色 Pydantic 校验模型。"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.menu import MenuOut


class RoleBase(BaseModel):
    name: str
    description: str = ""
    project_id: int
    is_active: Optional[bool] = True


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleOut(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    menus: List[MenuOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class RoleBrief(BaseModel):
    """角色简要信息（嵌套在用户返回中）。"""
    id: int
    name: str
    description: str = ""
    project_id: int


class RoleMenuAssign(BaseModel):
    """为角色分配菜单/按钮权限。"""
    menu_ids: List[int]
