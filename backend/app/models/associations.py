"""多对多关联表。"""
from sqlalchemy import Column, ForeignKey, Integer, Table

from app.common.database import Base

# 用户 ↔ 角色（角色按项目隔离，此关联自然实现用户-项目-角色的三元关系）
user_role = Table(
    "user_role",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
)

# 角色 ↔ 菜单
role_menu = Table(
    "role_menu",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
    Column("menu_id", Integer, ForeignKey("menu.id", ondelete="CASCADE"), primary_key=True),
)
