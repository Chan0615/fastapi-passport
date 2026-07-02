"""菜单模型。菜单按项目隔离，支持目录/菜单/按钮三种类型和树形层级。"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.common.database import Base
from app.models.associations import role_menu


class Menu(Base):
    __tablename__ = "menu"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(64), nullable=False, comment="菜单/按钮名称")
    menu_type = Column(String(16), default="menu", comment="类型：directory=目录 menu=菜单 button=按钮")
    path = Column(String(256), default="", comment="路由路径")
    icon = Column(String(64), default="", comment="图标")
    permission = Column(String(128), default="", comment="权限标识，如 user:add")
    parent_id = Column(Integer, ForeignKey("menu.id"), nullable=True, default=None, comment="父菜单 ID")
    project_id = Column(Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True, comment="所属项目 ID")
    sort_order = Column(Integer, default=0, comment="排序")
    is_visible = Column(Boolean, default=True, comment="是否可见")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    project = relationship("Project", back_populates="menus")
    children = relationship("Menu", backref="parent", remote_side=[id])
    roles = relationship("Role", secondary=role_menu, back_populates="menus")
