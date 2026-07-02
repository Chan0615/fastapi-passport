"""角色模型。角色按项目隔离，每个角色属于一个 Project。"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.common.database import Base
from app.models.associations import role_menu, user_role


class Role(Base):
    __tablename__ = "role"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(64), nullable=False, comment="角色名称")
    description = Column(String(255), default="", comment="角色描述")
    project_id = Column(Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True, comment="所属项目 ID")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    project = relationship("Project", back_populates="roles")
    users = relationship("User", secondary=user_role, back_populates="roles")
    menus = relationship("Menu", secondary=role_menu, back_populates="roles")
