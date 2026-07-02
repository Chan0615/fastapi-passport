"""系统操作日志模型。"""
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.common.database import Base


class OperationLog(Base):
    __tablename__ = "operation_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, comment="操作用户 ID")
    username = Column(String(64), nullable=True, comment="操作用户名")
    module = Column(String(64), default="", comment="功能模块")
    action = Column(String(64), default="", comment="操作类型：create/update/delete/login/logout 等")
    method = Column(String(10), default="", comment="HTTP 方法")
    path = Column(String(256), default="", comment="请求路径")
    params = Column(Text, comment="请求参数（JSON）")
    ip = Column(String(64), default="", comment="客户端 IP")
    status_code = Column(Integer, default=0, comment="响应状态码")
    cost_ms = Column(Integer, default=0, comment="耗时（毫秒）")
    error_msg = Column(Text, default="", comment="错误信息")
    created_at = Column(DateTime, server_default=func.now(), comment="操作时间")
