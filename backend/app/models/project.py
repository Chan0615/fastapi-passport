"""项目（租户）模型。每个业务系统注册为一个 Project。"""
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.common.database import Base


class Project(Base):
    __tablename__ = "project"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), nullable=False, comment="项目名称")
    project_code = Column(String(64), unique=True, nullable=False, index=True, comment="项目标识（业务系统唯一编码）")
    description = Column(String(255), default="", comment="项目描述")
    status = Column(String(16), default="active", comment="状态：active=启用 disabled=停用")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    roles = relationship("Role", back_populates="project", cascade="all, delete-orphan")
    menus = relationship("Menu", back_populates="project", cascade="all, delete-orphan")
    tokens = relationship("LongTermToken", back_populates="project", cascade="all, delete-orphan")
