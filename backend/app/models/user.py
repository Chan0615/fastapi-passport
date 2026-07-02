"""全局用户模型。用户在 passport 中是全局的，通过角色关联到不同项目。"""
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.common.database import Base
from app.models.associations import user_role


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True, comment="用户名")
    email = Column(String(128), nullable=True, comment="邮箱")
    display_name = Column(String(64), default="", comment="显示名称")
    hashed_password = Column(String(256), default="", comment="加密密码（LDAP 用户为空）")
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_superuser = Column(Boolean, default=False, comment="是否超级管理员")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    roles = relationship("Role", secondary=user_role, back_populates="users")
