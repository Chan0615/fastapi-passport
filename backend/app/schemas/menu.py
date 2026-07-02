"""菜单 Pydantic 校验模型。"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class MenuBase(BaseModel):
    name: str
    menu_type: str = "menu"
    path: str = ""
    icon: str = ""
    permission: str = ""
    parent_id: Optional[int] = None
    project_id: int
    sort_order: int = 0
    is_visible: Optional[bool] = True


class MenuCreate(MenuBase):
    pass


class MenuUpdate(BaseModel):
    name: Optional[str] = None
    menu_type: Optional[str] = None
    path: Optional[str] = None
    icon: Optional[str] = None
    permission: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None
    is_visible: Optional[bool] = None


class MenuOut(MenuBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
