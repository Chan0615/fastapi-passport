"""数据库连接池管理：从 config.yaml 引导数据库地址建立连接。

启动时自动检测并创建数据库（如果不存在），然后建表。
"""
import re
import logging

import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import bootstrap_config

logger = logging.getLogger(__name__)

# ────── 解析连接信息 ──────
_db_url = bootstrap_config.database_url
_pattern = r"mysql\+pymysql://(.+):(.+)@(.+):(\d+)/(.+?)(\?.*)?$"
_match = re.match(_pattern, _db_url)
if not _match:
    raise ValueError(f"无法解析 database_url: {_db_url}")

_db_user, _db_pass, _db_host, _db_port, _db_name = _match.groups()[:5]


def ensure_database() -> None:
    """确保目标数据库存在，不存在则自动创建。"""
    try:
        conn = pymysql.connect(
            host=_db_host,
            port=int(_db_port),
            user=_db_user,
            password=_db_pass,
            charset="utf8mb4",
        )
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{_db_name}` "
                f"DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.close()
        logger.info(f"数据库已就绪: {_db_name}")
    except pymysql.MySQLError as e:
        logger.error(f"数据库创建失败: {e}")
        raise


ensure_database()

engine = create_engine(
    _db_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI 依赖注入用的数据库会话生成器。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
