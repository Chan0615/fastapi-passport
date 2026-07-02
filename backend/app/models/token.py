"""长期令牌模型。用于业务系统 API 调用认证（非用户登录场景）。"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.common.database import Base


class LongTermToken(Base):
    __tablename__ = "long_term_token"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), nullable=False, comment="令牌名称/用途说明")
    token_hash = Column(String(512), unique=True, nullable=False, comment="令牌哈希值（bcrypt）")
    project_id = Column(Integer, ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True, comment="所属项目 ID")
    created_by = Column(Integer, ForeignKey("user.id"), nullable=True, comment="创建人用户 ID")
    is_active = Column(Boolean, default=True, comment="是否启用")
    expires_at = Column(DateTime, nullable=True, comment="过期时间（null 表示永不过期）")
    last_used_at = Column(DateTime, nullable=True, comment="最后使用时间")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")

    project = relationship("Project", back_populates="tokens")
